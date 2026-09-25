// Verificación automatizada para el fix #6 (comment stripper con state machine).
// Ejecutar: node tests/verify-comment-stripper.mjs
//
// Cubre los casos del issue original + las objeciones del revisor:
// - Strings y regex literales en C-style (URL con //, regex con //, template literals)
// - Division vs regex en C-style (incluyendo i++ / total — objecion del revisor)
// - Strings en SQL, Lua, Ruby (objecion del revisor)

import assert from "node:assert/strict";

// === Réplica de la lógica de commentStripper.ts ===
// Si commentStripper.ts cambia, este script debe actualizarse también.

function canStartRegex(prev) {
  if (prev === "") return true;
  return /[=([,!?;{}&|^~<>:*]/.test(prev);
}

function stripCStyleComments(source) {
  let result = "";
  let i = 0;
  const n = source.length;
  let lastSig = "";
  let pendingNewline = false;
  let state = "code";

  while (i < n) {
    const c = source[i];
    const c2 = i + 1 < n ? source[i + 1] : "";

    if (state === "line") {
      if (c === "\n") {
        result += c;
        i++;
        state = "code";
        lastSig = c;
        pendingNewline = false;
      } else {
        i++;
      }
    } else if (state === "block") {
      if (c === "*" && c2 === "/") {
        i += 2;
        state = "code";
      } else {
        i++;
      }
    } else if (state === "dstr") {
      result += c;
      if (c === "\\" && i + 1 < n) {
        result += c2;
        i += 2;
      } else if (c === '"') {
        i++;
        state = "code";
        lastSig = '"';
      } else {
        i++;
      }
    } else if (state === "sstr") {
      result += c;
      if (c === "\\" && i + 1 < n) {
        result += c2;
        i += 2;
      } else if (c === "'") {
        i++;
        state = "code";
        lastSig = "'";
      } else {
        i++;
      }
    } else if (state === "tpl") {
      result += c;
      if (c === "\\" && i + 1 < n) {
        result += c2;
        i += 2;
      } else if (c === "`") {
        i++;
        state = "code";
        lastSig = "`";
      } else {
        i++;
      }
    } else if (state === "re") {
      if (c === "\\" && i + 1 < n) {
        result += c + c2;
        i += 2;
      } else if (c === "[") {
        result += c;
        i++;
        while (i < n && source[i] !== "]") {
          if (source[i] === "\\" && i + 1 < n) {
            result += source[i] + source[i + 1];
            i += 2;
          } else {
            result += source[i];
            i++;
          }
        }
        if (i < n) {
          result += source[i];
          i++;
        }
      } else if (c === "/") {
        result += c;
        i++;
        state = "code";
        while (i < n && /[gimsuyn]/.test(source[i])) {
          result += source[i];
          i++;
        }
        lastSig = "/";
      } else {
        result += c;
        i++;
      }
    } else {
      if (c === "\n") {
        pendingNewline = true;
        i++;
      } else if (c === "/" && c2 === "/") {
        pendingNewline = false;
        i += 2;
        state = "line";
      } else if (c === "/" && c2 === "*") {
        pendingNewline = false;
        i += 2;
        state = "block";
      } else if (c === '"') {
        if (pendingNewline) {
          result += "\n";
          pendingNewline = false;
        }
        result += c;
        i++;
        state = "dstr";
        lastSig = c;
      } else if (c === "'") {
        if (pendingNewline) {
          result += "\n";
          pendingNewline = false;
        }
        result += c;
        i++;
        state = "sstr";
        lastSig = c;
      } else if (c === "`") {
        if (pendingNewline) {
          result += "\n";
          pendingNewline = false;
        }
        result += c;
        i++;
        state = "tpl";
        lastSig = c;
      } else if (c === "/" && canStartRegex(lastSig)) {
        if (pendingNewline) {
          result += "\n";
          pendingNewline = false;
        }
        result += c;
        i++;
        state = "re";
        lastSig = c;
      } else {
        if (pendingNewline) {
          result += "\n";
          pendingNewline = false;
        }
        result += c;
        if (!/\s/.test(c)) lastSig = c;
        i++;
      }
    }
  }
  if (pendingNewline) result += "\n";
  if (state === "line") result += "\n";
  return result;
}

function stripSqlComments(source) {
  let result = "";
  let i = 0;
  const n = source.length;
  let state = "code";
  while (i < n) {
    const c = source[i];
    const c2 = i + 1 < n ? source[i + 1] : "";
    if (state === "line") {
      if (c === "\n") {
        result += c;
        i++;
        state = "code";
      } else {
        i++;
      }
    } else if (state === "block") {
      if (c === "*" && c2 === "/") {
        i += 2;
        state = "code";
      } else {
        i++;
      }
    } else if (state === "sstr") {
      result += c;
      if (c === "'" && c2 === "'") {
        result += c2;
        i += 2;
      } else if (c === "'") {
        i++;
        state = "code";
      } else if (c === "\\" && i + 1 < n) {
        result += c2;
        i += 2;
      } else {
        i++;
      }
    } else {
      if (c === "-" && c2 === "-") {
        i += 2;
        state = "line";
      } else if (c === "/" && c2 === "*") {
        i += 2;
        state = "block";
      } else if (c === "'") {
        result += c;
        i++;
        state = "sstr";
      } else {
        result += c;
        i++;
      }
    }
  }
  return result;
}

function stripLuaComments(source) {
  let result = "";
  let i = 0;
  const n = source.length;
  let state = "code";
  const blockStack = [];
  while (i < n) {
    const c = source[i];
    const c2 = i + 1 < n ? source[i + 1] : "";
    if (state === "line") {
      if (c === "\n") {
        result += c;
        i++;
        state = "code";
      } else {
        i++;
      }
    } else if (state === "block") {
      const top = blockStack[blockStack.length - 1];
      if (top !== undefined && source.startsWith(top, i)) {
        i += top.length;
        blockStack.pop();
        if (blockStack.length === 0) state = "code";
        continue;
      }
      if (c === "[" && c2 === "[") {
        let level = 0;
        let j = i + 1;
        while (j < n && source[j] === "=") {
          level++;
          j++;
        }
        if (j < n && source[j] === "[") {
          blockStack.push("]" + "=".repeat(level) + "]");
          i = j + 1;
          continue;
        }
      }
      i++;
    } else if (state === "sstr" || state === "dstr") {
      result += c;
      const close = state === "sstr" ? "'" : '"';
      if (c === "\\" && i + 1 < n) {
        result += c2;
        i += 2;
      } else if (c === close) {
        i++;
        state = "code";
      } else if (c === "\n") {
        i++;
        state = "code";
      } else {
        i++;
      }
    } else {
      if (c === "-" && c2 === "-") {
        const c3 = i + 2 < n ? source[i + 2] : "";
        if (c3 === "[") {
          let level = 0;
          let j = i + 3;
          while (j < n && source[j] === "=") {
            level++;
            j++;
          }
          if (j < n && source[j] === "[") {
            blockStack.push("]" + "=".repeat(level) + "]");
            i = j + 1;
            state = "block";
            continue;
          }
        }
        i += 2;
        state = "line";
      } else if (c === "'") {
        result += c;
        i++;
        state = "sstr";
      } else if (c === '"') {
        result += c;
        i++;
        state = "dstr";
      } else {
        result += c;
        i++;
      }
    }
  }
  return result;
}

function stripRubyComments(source) {
  let stripped = source.replace(/^=begin[\s\S]*?^=end$/gm, "");
  let result = "";
  let i = 0;
  const n = stripped.length;
  let state = "code";
  while (i < n) {
    const c = stripped[i];
    const c2 = i + 1 < n ? stripped[i + 1] : "";
    if (state === "line") {
      if (c === "\n") {
        result += c;
        i++;
        state = "code";
      } else {
        i++;
      }
    } else if (state === "dstr" || state === "sstr") {
      result += c;
      const close = state === "dstr" ? '"' : "'";
      if (c === "\\" && i + 1 < n) {
        result += c2;
        i += 2;
      } else if (c === close) {
        i++;
        state = "code";
      } else {
        i++;
      }
    } else {
      if (c === "#") {
        i++;
        state = "line";
      } else if (c === '"') {
        result += c;
        i++;
        state = "dstr";
      } else if (c === "'") {
        result += c;
        i++;
        state = "sstr";
      } else {
        result += c;
        i++;
      }
    }
  }
  return result;
}

function stripPythonComments(source) {
  let result = source.replace(/^(\s*)"""[\s\S]*?"""/gm, "$1");
  result = result.replace(/^(\s*)'''[\s\S]*?'''/gm, "$1");
  result = result.replace(/#[^\n]*/g, "");
  return result;
}

function stripHashComments(source) {
  return source.replace(/#[^\n]*/g, "");
}

function getCommentStyle(ext) {
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "java",
      "kt",
      "kts",
      "c",
      "cpp",
      "cc",
      "cs",
      "h",
      "hpp",
      "hcl"
    ].includes(ext)
  )
    return "c_style";
  if (ext === "py") return "python";
  if (ext === "sql") return "sql_style";
  if (ext === "lua") return "lua_style";
  if (ext === "rb") return "ruby_style";
  return "hash_style";
}

function normalize(source, ext) {
  const style = getCommentStyle(ext);
  let stripped;
  switch (style) {
    case "c_style":
      stripped = stripCStyleComments(source);
      break;
    case "python":
      stripped = stripPythonComments(source);
      break;
    case "sql_style":
      stripped = stripSqlComments(source);
      break;
    case "lua_style":
      stripped = stripLuaComments(source);
      break;
    case "ruby_style":
      stripped = stripRubyComments(source);
      break;
    default:
      stripped = stripHashComments(source);
  }
  return stripped;
}

// === Helpers ===
function expect(name, input, ext, expected) {
  const got = normalize(input, ext);
  assert.equal(
    got,
    expected,
    `[${name}]\n  input:    ${JSON.stringify(input)}\n  got:      ${JSON.stringify(got)}\n  expected: ${JSON.stringify(expected)}`
  );
  console.log(`  \u2713 ${name}`);
}

// === Tests agrupados por categoria ===
let total = 0;

console.log("=== C-style: strings protegidas ===");
expect(
  "URL con // en string",
  'const url = "https://example.com//path"',
  "js",
  'const url = "https://example.com//path"'
);
expect(
  "String con // falso comentario",
  'const s = "http://not-a//comment"',
  "js",
  'const s = "http://not-a//comment"'
);
expect(
  "String con /* falso bloque",
  'const s = "/* not a comment */"',
  "js",
  'const s = "/* not a comment */"'
);
expect("Comillas simples", `const s = 'http://x.com//y'; `, "js", `const s = 'http://x.com//y'; `);
expect(
  "Template literal con //",
  "const t = `url: https://x.com//y`; ",
  "js",
  "const t = `url: https://x.com//y`; "
);
expect(
  "Escape en string",
  'const s = "say \\"hi\\" // not comment"; ',
  "js",
  'const s = "say \\"hi\\" // not comment"; '
);
total += 6;

console.log("\n=== C-style: regex literales protegidos ===");
expect("Regex literal basico", "const re = /\\/*foo/g", "js", "const re = /\\/*foo/g");
expect("Regex literal con //", "const re = /\\/\\//foo/g", "js", "const re = /\\/\\//foo/g");
expect("Regex con flags multi", "const re = /foo/gim; ", "js", "const re = /foo/gim; ");
expect("Division normal sigue funcionando", "const x = a / b; ", "js", "const x = a / b; ");
expect("Regex precedido de ,", "arr = [/foo/, /bar/]; ", "js", "arr = [/foo/, /bar/]; ");
expect("Regex con clase [a/b]", "const re = /[a/b]c/g", "js", "const re = /[a/b]c/g");
total += 6;

console.log("\n=== C-style: division vs regex (objeción revisor) ===");
expect(
  "i++ / total con comentario después (objeción #1)",
  "let ratio = i++ / total;\n// comentario real\nlet z = 3;",
  "js",
  "let ratio = i++ / total;\nlet z = 3;"
);
expect(
  "i-- / total con comentario después",
  "let ratio = i-- / total;\n// comentario real\nlet z = 3;",
  "js",
  "let ratio = i-- / total;\nlet z = 3;"
);
expect("a + b / c (mixto)", "const x = a + b / c;\n// comment", "js", "const x = a + b / c;\n");
total += 3;

console.log("\n=== C-style: comentarios ===");
expect("Bloque simple", "/* comment */ code", "js", " code");
expect("Line comment", "code // comment\nmore", "js", "code \nmore");
total += 2;

console.log("\n=== SQL: strings y comentarios (objeción revisor) ===");
expect(
  "SQL con string que contiene -- (CASO REVISOR)",
  `SELECT 1; -- linea\n/* bloque\nmultilinea */\nSELECT '--not a comment';`,
  "sql",
  `SELECT 1; \n\nSELECT '--not a comment';`
);
expect(
  "SQL line comment simple",
  "SELECT * FROM t -- comment\nWHERE x = 1",
  "sql",
  "SELECT * FROM t \nWHERE x = 1"
);
expect("SQL block comment", "SELECT /* inline */ * FROM t", "sql", "SELECT  * FROM t");
expect(
  "SQL escape de comilla doble",
  `SELECT 'it''s ok' AS x -- comment`,
  "sql",
  `SELECT 'it''s ok' AS x `
);
total += 4;

console.log("\n=== Lua: strings y comentarios (objeción revisor) ===");
expect(
  "Lua line comment",
  "local x = 1 -- comment\nlocal y = 2",
  "lua",
  "local x = 1 \nlocal y = 2"
);
expect(
  "Lua block comment --[[ ]]",
  "local x = 1 --[[ comment ]] local y = 2",
  "lua",
  "local x = 1  local y = 2"
);
expect("Lua block con == anidado", "--[==[ nested ]==] code", "lua", " code");
expect(
  "Lua string con -- dentro",
  `local s = '--not-comment' -- real`,
  "lua",
  `local s = '--not-comment' `
);
expect(
  "Lua double string",
  `local s = "-- also not --" -- real`,
  "lua",
  `local s = "-- also not --" `
);
total += 5;

console.log("\n=== Ruby: strings y comentarios (objeción revisor) ===");
expect("Ruby line comment", "x = 1 # comment\ny = 2", "rb", "x = 1 \ny = 2");
expect("Ruby block comment", "x = 1\n=begin\nmulti\n=end\ny = 2", "rb", "x = 1\n\ny = 2");
expect("Ruby string con # dentro", `x = "#not-comment" # real`, "rb", `x = "#not-comment" `);
expect("Ruby single string", `x = '#not-comment' # real`, "rb", `x = '#not-comment' `);
total += 4;

console.log("\n=== Python: docstrings ===");
expect("Python docstring top-level", '"""docstring"""\nx = 1', "py", "\nx = 1");
expect("Python mid-line string preserved", 's = foo; "docstring"', "py", 's = foo; "docstring"');
expect("Python # comment", "x = 1 # comment\ny = 2", "py", "x = 1 \ny = 2");
total += 3;

console.log(`\n✅ ${total} escenarios pasaron.`);
