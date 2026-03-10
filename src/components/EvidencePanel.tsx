import { Citation } from "../types";
import { CitationCard } from "./CitationCard";
import { motion, AnimatePresence } from "motion/react";
import { X, Layers, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";

interface EvidencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
}

export function EvidencePanel({
  isOpen,
  onClose,
  citations,
}: EvidencePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#050505] border-l border-white/10 shadow-2xl flex flex-col",
              "lg:relative lg:translate-x-0 lg:w-[450px]",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-accent-gold">
                  <Layers size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Intelligence</span>
                </div>
                <h3 className="font-serif italic text-2xl text-white">
                  Evidence & Context
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-all border border-transparent hover:border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {/* Research Summary */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Aggregate Confidence</p>
                    <p className="text-3xl font-serif italic text-white">94.2%</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Sources Analyzed</p>
                    <p className="text-xl font-mono text-accent-gold">{citations.length}</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "94.2%" }}
                    className="h-full bg-gradient-to-r from-accent-gold to-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                    Verified Citations
                  </h4>
                  <div className="h-px flex-1 bg-white/5 ml-4" />
                </div>
                
                <div className="space-y-4">
                  {citations.map((citation) => (
                    <CitationCard key={citation.id} citation={citation} />
                  ))}
                  {citations.length === 0 && (
                    <div className="text-center py-20 space-y-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                        <Layers size={20} className="text-text-muted" />
                      </div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-widest">
                        No active citations
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Metadata */}
              <div className="pt-8 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                    <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Latency</p>
                    <p className="text-xs font-mono text-text-secondary">142ms</p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                    <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Model</p>
                    <p className="text-xs font-mono text-text-secondary">Vox-3.1-Pro</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
