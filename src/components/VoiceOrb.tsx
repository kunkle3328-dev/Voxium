import { motion } from "motion/react";
import { VoiceState } from "../types";
import { cn } from "../utils/cn";

interface VoiceOrbProps {
  state: VoiceState;
  className?: string;
}

export function VoiceOrb({ state, className }: VoiceOrbProps) {
  const getOrbColor = () => {
    switch (state) {
      case "listening":
        return "from-rose-500 via-rose-400 to-rose-600";
      case "processing":
        return "from-accent-violet via-accent-blue to-accent-cyan";
      case "speaking":
        return "from-emerald-500 via-emerald-400 to-emerald-600";
      case "interrupted":
        return "from-amber-500 via-orange-400 to-red-600";
      case "error":
        return "from-red-700 via-red-600 to-red-800";
      default:
        return "from-accent-gold via-yellow-500 to-orange-500";
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Background Glow */}
      <motion.div
        animate={{
          scale: state === "listening" ? [1, 1.2, 1] : state === "speaking" ? [1, 1.1, 1] : 1,
          opacity: state === "idle" ? 0.3 : 0.6,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "absolute inset-0 rounded-full blur-3xl bg-gradient-to-tr",
          getOrbColor()
        )}
      />

      {/* Main Orb */}
      <motion.div
        animate={{
          scale: state === "listening" ? [1, 1.1, 1] : state === "processing" ? [1, 0.9, 1] : 1,
          rotate: state === "processing" ? 360 : 0,
        }}
        transition={{
          duration: state === "processing" ? 3 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "w-full h-full rounded-full bg-gradient-to-tr shadow-2xl relative z-10",
          getOrbColor(),
          "shadow-[inset_0_2px_10px_rgba(255,255,255,0.3),0_0_40px_rgba(0,0,0,0.5)]"
        )}
      >
        {/* Inner Highlight */}
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white/20 rounded-full blur-md" />
      </motion.div>

      {/* Pulse Rings */}
      {state === "listening" && (
        <>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-full border border-rose-500/30"
            />
          ))}
        </>
      )}
    </div>
  );
}
