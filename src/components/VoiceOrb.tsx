import { motion, AnimatePresence } from "motion/react";
import { VoiceState } from "../types";
import { cn } from "../utils/cn";

interface VoiceOrbProps {
  state: VoiceState;
  className?: string;
  onClick?: () => void;
}

export function VoiceOrb({ state, className, onClick }: VoiceOrbProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center cursor-pointer group",
        className,
      )}
      onClick={onClick}
    >
      {/* Immersive Atmosphere */}
      <AnimatePresence>
        {state !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-[-50%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_70%)] blur-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Layered Glows */}
      <motion.div
        className="absolute inset-0 rounded-full bg-accent-violet/20 blur-2xl"
        animate={{
          scale: state === "speaking" ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: state === "idle" ? 0.3 : 0.6,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute inset-0 rounded-full bg-accent-cyan/10 blur-3xl"
        animate={{
          scale: state === "listening" ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: state === "listening" ? 0.5 : 0.2,
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-white/10"
        animate={{
          rotate: 360,
          scale: state === "thinking" ? 1.05 : 1,
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Pulsing Rings */}
      <AnimatePresence>
        {state === "listening" && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-accent-cyan/30"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5 + i * 0.2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* The Core */}
      <motion.div
        className={cn(
          "relative z-10 rounded-full shadow-2xl overflow-hidden",
          "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20",
        )}
        style={{ width: "70%", height: "70%" }}
        animate={{
          scale: state === "speaking" ? [1, 1.05, 0.98, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.5, repeat: state === "speaking" ? Infinity : 0 }}
      >
        {/* Internal Fluid Effect */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-40 bg-gradient-to-tr",
            state === "listening" ? "from-accent-cyan via-blue-500 to-transparent" :
            state === "speaking" ? "from-accent-violet via-fuchsia-500 to-transparent" :
            state === "thinking" ? "from-accent-gold via-orange-500 to-transparent" :
            "from-white/10 to-transparent"
          )}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Core Light */}
        <motion.div
          className={cn(
            "absolute inset-[20%] rounded-full blur-md opacity-80",
            state === "listening" ? "bg-accent-cyan" :
            state === "speaking" ? "bg-accent-violet" :
            state === "thinking" ? "bg-accent-gold" :
            "bg-white/20"
          )}
          animate={{
            scale: state === "idle" ? [1, 1.1, 1] : [1, 1.3, 0.9, 1.1, 1],
          }}
          transition={{ duration: state === "idle" ? 4 : 1, repeat: Infinity }}
        />

        {/* Surface Shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
      </motion.div>

      {/* Status Label */}
      <motion.div
        className="absolute -bottom-12 left-1/2 -translate-x-1/2"
        animate={{ opacity: state === "idle" ? 0.4 : 1 }}
      >
        <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/60">
          {state === "idle" ? "Standby" : state}
        </span>
      </motion.div>
    </div>
  );
}
