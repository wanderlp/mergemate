/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        vscode: {
          bg: '#1e1e1e',
          sidebar: '#252526',
          panel: '#1e1e1e',
          border: '#3e3e42',
          hover: '#2a2d2e',
          active: '#37373d',
          text: '#cccccc',
          muted: '#858585'
        }
      }
    }
  },
  plugins: []
}
