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
      <div className="relative w-full lg:w-1/2 flex flex-col p-6 md:p-12 lg:p-16 justify-between border-b lg:border-b-0 lg:border-r border-surface-border bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.08)_0%,transparent_50%)] text-center lg:text-left items-center lg:items-start">
        <header className="z-10 w-full flex justify-center lg:justify-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-accent-violet to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-violet/20">
              <Sparkles className="text-white" size={16} />
            </div>
            <span className="font-display font-bold text-xl md:text-2xl tracking-tighter text-white">
              Voxium
            </span>
          </motion.div>
        </header>

        <div className="z-10 mt-10 mb-10 lg:my-0 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center lg:items-start"
          >
            <h1 className="font-serif italic text-5xl md:text-7xl lg:text-[120px] leading-[0.9] tracking-tighter text-white mb-6">
              The Art of <br />
              <span className="text-accent-gold not-italic font-display font-bold uppercase text-3xl md:text-5xl lg:text-7xl tracking-[0.15em] block mt-2">
                Inquiry
              </span>
            </h1>
            <p className="text-text-secondary text-base md:text-lg max-w-sm md:max-w-md font-light leading-relaxed mx-auto lg:mx-0">
              A refined research companion that transforms complex data into human conversation. 
              Speak, listen, and evolve your understanding.
            </p>
          </motion.div>
        </div>

        <footer className="z-10 w-full flex justify-center lg:justify-start overflow-hidden">
          <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs uppercase tracking-[0.2em] text-text-muted font-medium whitespace-nowrap">
            <span>Intelligence</span>
            <div className="w-1 h-1 rounded-full bg-accent-gold shrink-0" />
            <span>Elegance</span>
            <div className="w-1 h-1 rounded-full bg-accent-gold shrink-0" />
            <span>Precision</span>
          </div>
        </footer>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-accent-violet/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent-cyan/5 blur-[120px] rounded-full" />
      </div>

      {/* Right Pane: Interaction */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 relative bg-surface/30">
        <div className="w-full max-w-lg space-y-8 md:space-y-12">
          <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
            <button 
              onClick={() => handleStart()}
              className="relative group active:scale-95 transition-transform"
            >
              <VoiceOrb state="idle" className="w-40 h-40 md:w-64 md:h-64" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Mic className="text-white w-6 h-6 md:w-8 md:h-8" />
              </div>
            </button>
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-display font-medium text-white">Start a Conversation</h2>
              <p className="text-text-secondary text-xs md:text-sm">Select a mode and speak your inquiry</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="w-full relative px-2">
              <ModeSelector 
                activeMode={activeMode} 
                onSelectMode={setActiveMode} 
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-accent-gold/5 blur-xl group-focus-within:bg-accent-gold/10 transition-all rounded-3xl" />
              <div className="relative flex items-center bg-surface border border-surface-border rounded-2xl p-1.5 md:p-2 pl-4 md:pl-6 focus-within:border-accent-gold/50 transition-all">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  placeholder="Ask anything..." 
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-text-muted font-light h-10 md:h-12 text-sm md:text-base"
                />
                <button 
                  onClick={() => handleStart()}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white text-black flex items-center justify-center hover:bg-accent-gold hover:text-white transition-all active:scale-95 shadow-lg shrink-0"
                >
                  <ArrowRight className="w-[18px] h-[18px] md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[
                "Explain fusion energy",
                "Debate UBI viability",
                "Teach me economics",
                "Market analysis of AI"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleStart(suggestion)}
                  className="p-4 rounded-xl border border-surface-border bg-surface/50 text-left hover:bg-surface-hover hover:border-accent-gold/30 transition-all group"
                >
                  <p className="text-xs text-text-muted uppercase tracking-widest mb-1 font-bold group-hover:text-accent-gold transition-colors">Prompt</p>
                  <p className="text-sm text-text-secondary group-hover:text-white transition-colors">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-surface-border flex items-center justify-between text-[10px] uppercase tracking-widest text-text-muted font-bold">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>Recent Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <LineChart size={12} />
              <span>Global Trends</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
