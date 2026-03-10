import { useState } from "react";
import { AppMode } from "../types";
import { APP_MODES } from "../constants";
import { VoiceOrb } from "../components/VoiceOrb";
import { ModeSelector } from "../components/ModeSelector";
import { motion } from "motion/react";
import { Mic, ArrowRight, Sparkles, Clock, LineChart } from "lucide-react";

interface HomeProps {
  onStartConversation: (mode: AppMode, initialPrompt?: string) => void;
}

export function Home({ onStartConversation }: HomeProps) {
  const [activeMode, setActiveMode] = useState<AppMode>("explore");
  const [prompt, setPrompt] = useState("");

  const handleStart = (text?: string) => {
    onStartConversation(activeMode, text || prompt);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-x-hidden selection:bg-accent-gold/30">
      {/* Left Pane: Hero & Branding */}
      <div className="relative w-full lg:w-1/2 flex flex-col p-6 sm:p-8 lg:p-16 justify-between border-b lg:border-b-0 lg:border-r border-white/5 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.08)_0%,transparent_50%)]">
        <header className="z-10 flex justify-center lg:justify-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-violet to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-violet/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="font-display font-bold text-2xl tracking-tighter text-white">
              Voxium
            </span>
          </motion.div>
        </header>

        <div className="z-10 mt-12 lg:mt-0 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-serif italic text-5xl sm:text-7xl md:text-8xl lg:text-[120px] leading-[0.9] tracking-tighter text-white mb-6 sm:mb-8">
              The Art of <br />
              <span className="text-accent-gold not-italic font-display font-bold uppercase text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[0.2em] sm:tracking-widest block mt-2 sm:mt-4">
                Inquiry
              </span>
            </h1>
            <p className="text-text-secondary text-base sm:text-lg md:text-xl max-w-md mx-auto lg:mx-0 font-light leading-relaxed">
              A refined research companion that transforms complex data into human conversation. 
              Speak, listen, and evolve your understanding.
            </p>
          </motion.div>
        </div>

        <footer className="z-10 mt-12 lg:mt-0 flex justify-center lg:justify-start">
          <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 sm:gap-6 text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-text-muted font-medium">
            <span>Intelligence</span>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-accent-gold" />
            <span>Elegance</span>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-accent-gold" />
            <span>Precision</span>
          </div>
        </footer>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-accent-violet/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent-cyan/5 blur-[120px] rounded-full" />
      </div>

      {/* Right Pane: Interaction */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative bg-surface/30">
        <div className="max-w-md w-full z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12 flex flex-col items-center"
          >
            <div className="relative group cursor-pointer" onClick={() => handleStart()}>
              <div className="absolute inset-0 bg-accent-gold/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <VoiceOrb
                state="idle"
                className="w-48 h-48 md:w-56 md:h-56 relative z-10"
              />
              <motion.div 
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <span className="text-[10px] uppercase tracking-[0.4em] text-accent-gold font-bold">
                  Begin Session
                </span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold ml-1">
                Select Domain
              </label>
              <ModeSelector
                activeMode={activeMode}
                onSelectMode={setActiveMode}
                className="justify-start"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-gold/50 to-accent-violet/50 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
              <div className="relative glass-panel rounded-2xl p-1.5 flex items-center border-white/5 shadow-2xl">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  placeholder="What shall we explore today?"
                  className="flex-1 bg-transparent border-none outline-none text-text-primary px-4 py-3 text-sm placeholder:text-text-muted font-light"
                />
                <button
                  onClick={() => handleStart()}
                  disabled={!prompt.trim()}
                  className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center disabled:opacity-20 disabled:grayscale hover:bg-accent-gold hover:text-white transition-all duration-300"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold mb-4 ml-1">
                Suggested Inquiries
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "The philosophy of artificial consciousness",
                  "Quantum entanglement and non-locality",
                  "The future of decentralized economies"
                ].map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStart(topic)}
                    className="text-left text-xs px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent-gold/30 transition-all text-text-secondary group flex items-center justify-between"
                  >
                    <span>{topic}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Background vertical text */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 writing-mode-vertical select-none pointer-events-none opacity-[0.02] font-display font-black text-9xl uppercase tracking-tighter">
          Voxium
        </div>
      </div>
    </div>
  );
}
