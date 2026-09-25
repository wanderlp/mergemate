import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { ScanProgress } from "../types";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";

interface ProgressBarProps {
  progress: ScanProgress;
  onCancel: () => void;
}

export function ProgressBar({ progress, onCancel }: ProgressBarProps): React.JSX.Element {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.2;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70"
      role="status"
      aria-live="polite"
      aria-label={t("progress.ariaLabel")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    >
      <motion.div
        className="w-96 rounded-lg bg-[#252526] p-6 shadow-2xl"
        initial={{
          opacity: 0,
          scale: shouldReduceMotion ? 1 : 0.95,
          y: shouldReduceMotion ? 0 : -8
        }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : -8 }}
        transition={{ duration, ease: "easeOut" }}
      >
        <div className="mb-3 text-base font-medium text-[#cccccc]">{t("progress.title")}</div>
        <Progress value={progress.percent} className="mb-2" />
        <div className="truncate text-sm text-[#aaaaaa]">
          {progress.currentFile || t("progress.starting")}
        </div>
        <div className="mt-1 text-right text-sm text-[#aaaaaa]">{progress.percent}%</div>
        <Button onClick={onCancel} variant="ghost" size="sm" className="mt-3 w-full">
          {t("progress.cancel")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
