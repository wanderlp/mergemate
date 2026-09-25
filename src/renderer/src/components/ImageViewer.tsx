import React, { useState, useEffect, useRef, useCallback } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { ZoomIn, ZoomOut, RotateCcw, ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FileEntry } from "../types";
import type { ImageDims } from "./StatusBar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

interface ImageViewerProps {
  file: FileEntry;
  onDimsLoaded?: (left: ImageDims | null, right: ImageDims | null) => void;
}

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
  tif: "image/tiff",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml"
};

function toDataUrl(base64: string, ext: string): string {
  const mime = MIME[ext.toLowerCase()] ?? "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

type ViewMode = "slider" | "sidebyside" | "left" | "right" | "diff";

const MAX_DIFF_PIXELS = 3840 * 2160;

function getImageDims(url: string): Promise<ImageDims> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

export function ImageViewer({ file, onDimsLoaded }: ImageViewerProps): React.JSX.Element {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ViewMode>("sidebyside");
  const [zoom, setZoom] = useState(1);
  const [leftUrl, setLeftUrl] = useState<string | null>(null);
  const [rightUrl, setRightUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [diffThreshold, setDiffThreshold] = useState(30);
  const [diffOverlay, setDiffOverlay] = useState(false);
  const [diffTooLarge, setDiffTooLarge] = useState(false);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setLoading(true);
    setLeftUrl(null);
    setRightUrl(null);

    let leftDataUrl: string | null = null;
    let rightDataUrl: string | null = null;

    const promises: Promise<void>[] = [];

    if (file.leftPath) {
      promises.push(
        window.electronAPI
          .readFileBase64(file.leftPath)
          .then((b64) => {
            leftDataUrl = toDataUrl(b64, file.extension);
            setLeftUrl(leftDataUrl);
          })
          .catch(() => setLeftUrl(null))
      );
    }
    if (file.rightPath) {
      promises.push(
        window.electronAPI
          .readFileBase64(file.rightPath)
          .then((b64) => {
            rightDataUrl = toDataUrl(b64, file.extension);
            setRightUrl(rightDataUrl);
          })
          .catch(() => setRightUrl(null))
      );
    }

    Promise.all(promises)
      .then(async () => {
        if (!onDimsLoaded) return;
        const [leftDims, rightDims] = await Promise.all([
          leftDataUrl ? getImageDims(leftDataUrl).catch(() => null) : Promise.resolve(null),
          rightDataUrl ? getImageDims(rightDataUrl).catch(() => null) : Promise.resolve(null)
        ]);
        onDimsLoaded(leftDims, rightDims);
      })
      .finally(() => setLoading(false));
  }, [file.leftPath, file.rightPath, file.extension]);

  const bothExist = Boolean(leftUrl && rightUrl);
  const onlyLeft = Boolean(leftUrl && !rightUrl);
  const isIdentical = file.status === "identical";

  const effectiveMode: ViewMode =
    !bothExist || isIdentical ? (onlyLeft || isIdentical ? "left" : "right") : mode;

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [file.leftPath, file.rightPath]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = pan;
      setIsDragging(true);
      e.preventDefault();
    },
    [zoom, pan]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y)
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);

  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.cancelable) return;
      e.preventDefault();

      // Ctrl+wheel = pinch zoom (Mac); Shift+wheel o scroll horizontal = pan; resto = zoom
      const isHorizontalIntent = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const isZoomIntent = e.ctrlKey || !isHorizontalIntent;

      if (isZoomIntent) {
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoom((z) => Math.min(4, Math.max(0.25, parseFloat((z + delta).toFixed(2)))));
      } else if (zoom > 1) {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    },
    [zoom]
  );

  useEffect(() => {
    const el = sliderContainerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel, effectiveMode]);

  function handleZoomIn(): void {
    setZoom((z) => Math.min(z + 0.25, 4));
  }
  function handleZoomOut(): void {
    setZoom((z) => Math.max(z - 0.25, 0.25));
  }
  function handleReset(): void {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  useEffect(() => {
    if (effectiveMode !== "diff" || !leftUrl || !rightUrl) return;
    let cancelled = false;
    const canvas = diffCanvasRef.current;
    if (!canvas) return;

    const compute = async (): Promise<void> => {
      const leftImg = new Image();
      const rightImg = new Image();
      await Promise.all([
        new Promise<void>((r) => {
          leftImg.onload = () => r();
          leftImg.onerror = () => r();
          leftImg.src = leftUrl;
        }),
        new Promise<void>((r) => {
          rightImg.onload = () => r();
          rightImg.onerror = () => r();
          rightImg.src = rightUrl;
        })
      ]);
      if (cancelled) return;

      const w = Math.min(leftImg.naturalWidth, rightImg.naturalWidth);
      const h = Math.min(leftImg.naturalHeight, rightImg.naturalHeight);
      if (w * h > MAX_DIFF_PIXELS) {
        setDiffTooLarge(true);
        return;
      }
      setDiffTooLarge(false);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(leftImg, 0, 0, w, h);
      const leftData = ctx.getImageData(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(rightImg, 0, 0, w, h);
      const rightData = ctx.getImageData(0, 0, w, h);

      const out = ctx.createImageData(w, h);
      for (let i = 0; i < leftData.data.length; i += 4) {
        const dr = Math.abs(leftData.data[i] - rightData.data[i]);
        const dg = Math.abs(leftData.data[i + 1] - rightData.data[i + 1]);
        const db = Math.abs(leftData.data[i + 2] - rightData.data[i + 2]);
        const isDiff = Math.max(dr, dg, db) > diffThreshold;
        if (isDiff) {
          if (diffOverlay) {
            out.data[i] = Math.round((leftData.data[i] + 255) / 2);
            out.data[i + 1] = Math.round(leftData.data[i + 1] / 2);
            out.data[i + 2] = Math.round((leftData.data[i + 2] + 255) / 2);
          } else {
            out.data[i] = 255;
            out.data[i + 1] = 0;
            out.data[i + 2] = 255;
          }
          out.data[i + 3] = 255;
        } else {
          if (diffOverlay) {
            out.data[i] = leftData.data[i];
            out.data[i + 1] = leftData.data[i + 1];
            out.data[i + 2] = leftData.data[i + 2];
            out.data[i + 3] = 255;
          } else {
            out.data[i + 3] = 0;
          }
        }
      }
      if (!cancelled) ctx.putImageData(out, 0, 0);
    };

    const raf = requestAnimationFrame(() => {
      void compute();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [effectiveMode, leftUrl, rightUrl, diffThreshold, diffOverlay]);

  const modes: ViewMode[] =
    bothExist && !isIdentical
      ? ["sidebyside", "slider", "diff", "left", "right"]
      : ["sidebyside", "slider", "left", "right"];

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <div className="flex items-center gap-2 border-b border-[#3e3e42] bg-[#252526] px-3 py-2">
        <span className="truncate text-sm text-[#cccccc]">{file.relativePath}</span>

        <div className="ml-auto flex items-center gap-1">
          {bothExist &&
            !isIdentical &&
            modes.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "primary" : "default"}
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {t(`image.${m}`)}
              </Button>
            ))}
          {isIdentical && (
            <span className="rounded bg-green-900/40 px-2 py-1 text-xs text-green-400">
              {t("image.identical")}
            </span>
          )}

          <Separator orientation="vertical" className="mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                aria-label={t("image.zoomOut")}
              >
                <ZoomOut size={14} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("image.zoomOut")}</TooltipContent>
          </Tooltip>
          <span className="w-12 text-center text-xs text-[#aaaaaa]">{Math.round(zoom * 100)}%</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                aria-label={t("image.zoomIn")}
              >
                <ZoomIn size={14} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("image.zoomIn")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" onClick={handleReset} aria-label={t("image.zoomReset")}>
                <RotateCcw size={14} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("image.zoomReset")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center bg-[#181818]">
          <span className="text-sm text-[#858585]">{t("image.loading")}</span>
        </div>
      ) : effectiveMode === "slider" && leftUrl && rightUrl ? (
        <div
          ref={sliderContainerRef}
          role="img"
          aria-label={t("image.compareAriaLabel", { path: file.relativePath })}
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#181818] p-12"
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease",
              userSelect: "none"
            }}
          >
            <ReactCompareSlider
              style={{ width: "100%", height: "100%", borderRadius: 4, overflow: "hidden" }}
              itemOne={
                <ReactCompareSliderImage
                  src={leftUrl}
                  alt={t("image.leftLabel")}
                  style={{ objectFit: "contain" }}
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={rightUrl}
                  alt={t("image.rightLabel")}
                  style={{ objectFit: "contain" }}
                />
              }
            />
          </div>
        </div>
      ) : effectiveMode === "diff" && leftUrl && rightUrl ? (
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#181818] p-6">
          {diffTooLarge ? (
            <div className="text-sm text-[#858585]">{t("image.diffTooLarge")}</div>
          ) : (
            <div
              className="flex flex-1 items-center justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              <canvas
                ref={diffCanvasRef}
                className="max-w-full max-h-full rounded"
                style={{ objectFit: "contain" }}
                aria-label={t("image.diffAriaLabel")}
              />
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 rounded border border-[#3e3e42] bg-[#252526] px-4 py-2 text-xs text-[#cccccc]">
            <label className="flex items-center gap-2">
              <span>{t("image.threshold")}</span>
              <input
                type="range"
                min={0}
                max={255}
                value={diffThreshold}
                onChange={(e) => setDiffThreshold(Number(e.target.value))}
                aria-label={t("image.threshold")}
                aria-valuemin={0}
                aria-valuemax={255}
                aria-valuenow={diffThreshold}
                className="accent-[#007acc]"
              />
              <span className="w-8 text-right tabular-nums">{diffThreshold}</span>
            </label>
            <Separator orientation="vertical" className="mx-1" />
            <button
              type="button"
              onClick={() => setDiffOverlay((v) => !v)}
              aria-pressed={diffOverlay}
              className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors ${diffOverlay ? "bg-[#007acc]" : "hover:bg-[#3e3e42]"}`}
            >
              <ScanLine size={12} aria-hidden="true" />
              {diffOverlay ? t("image.overlayOn") : t("image.overlayOff")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden bg-[#181818]">
          {(effectiveMode === "sidebyside" || effectiveMode === "left") && leftUrl && (
            <ImagePanel
              url={leftUrl}
              label={isIdentical ? "" : t("image.leftLabel")}
              zoom={zoom}
              pan={pan}
              isDragging={isDragging}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              panelAriaLabel={t("image.panelAriaLabel", { label: t("image.leftLabel") })}
            />
          )}
          {(effectiveMode === "sidebyside" || effectiveMode === "right") && rightUrl && (
            <ImagePanel
              url={rightUrl}
              label={isIdentical ? "" : t("image.rightLabel")}
              zoom={zoom}
              pan={pan}
              isDragging={isDragging}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              panelAriaLabel={t("image.panelAriaLabel", { label: t("image.rightLabel") })}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ImagePanelProps {
  url: string;
  label: string;
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  panelAriaLabel: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: WheelEvent) => void;
}

function ImagePanel({
  url,
  label,
  zoom,
  pan,
  isDragging,
  panelAriaLabel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel
}: ImagePanelProps): React.JSX.Element {
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        ref={wheelRef}
        role="img"
        aria-label={panelAriaLabel}
        className="relative flex flex-1 items-center justify-center overflow-hidden p-12"
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          src={url}
          alt={label}
          draggable={false}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: 4,
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease",
            userSelect: "none"
          }}
        />
      </div>
      {label && (
        <div className="flex-shrink-0 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-[#858585]">
          {label}
        </div>
      )}
    </div>
  );
}
