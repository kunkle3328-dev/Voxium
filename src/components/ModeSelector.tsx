import { AppMode } from "../types";
import { APP_MODES } from "../constants";
import { cn } from "../utils/cn";
import { motion } from "motion/react";
import * as Icons from "lucide-react";

interface ModeSelectorProps {
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  className?: string;
}

export function ModeSelector({
  activeMode,
  onSelectMode,
  className,
}: ModeSelectorProps) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto no-scrollbar pb-2", className)}
    >
      {APP_MODES.map((mode) => {
        const Icon = (Icons as any)[mode.icon];
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={cn(
              "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-500",
              isActive
                ? "text-white"
                : "text-text-muted hover:text-white border border-white/5 bg-white/[0.02]",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeMode"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-gold to-orange-600 shadow-lg shadow-accent-gold/20 -z-10"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon
              size={14}
              className={cn(isActive ? "text-white" : "text-text-muted")}
            />
            {mode.name}
          </button>
        );
      })}
    </div>
  );
}
