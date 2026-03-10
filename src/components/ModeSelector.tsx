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
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 snap-x snap-mandatory scroll-smooth",
        )}
      >
        {APP_MODES.map((mode) => {
          const Icon = (Icons as any)[mode.icon] || Icons.HelpCircle;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 snap-start",
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
                className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-text-muted")}
              />
              {mode.name}
            </button>
          );
        })}
      </div>
      {/* Scroll indicators */}
      <div className="absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-50" />
      <div className="absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-50" />
    </div>
  );
}
