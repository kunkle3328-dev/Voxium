import { Message } from "../types";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Copy, Check } from "lucide-react";
import Markdown from "react-markdown";
import { useState } from "react";

interface TranscriptMessageProps {
  key?: string | number;
  message: Message;
  onCiteClick?: (citationId: string) => void;
}

export function TranscriptMessage({
  message,
  onCiteClick,
}: TranscriptMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-8",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[95%] sm:max-w-[92%] md:max-w-[85%] rounded-[1.5rem] sm:rounded-[2rem] px-4 sm:px-6 py-4 sm:py-6 relative group",
          isUser
            ? "bg-surface-hover text-text-primary rounded-tr-sm border border-surface-border shadow-sm"
            : "glass-card text-text-primary rounded-tl-sm border-white/10",
          !isUser && message.isStreaming && "ring-1 ring-accent-gold/20 animate-pulse"
        )}
      >
        {!isUser && (
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 text-accent-gold">
              <Sparkles size={12} className="sm:size-[14px]" />
              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase">
                {message.expertName ? `${message.expertName} AI` : "Voxium Intelligence"}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-accent-gold transition-all"
              title="Copy to clipboard"
            >
              {copied ? <Check size={12} className="text-emerald-400 sm:size-[14px]" /> : <Copy size={12} className="sm:size-[14px]" />}
            </button>
          </div>
        )}

        <div className={cn(
          "leading-relaxed text-sm sm:text-base md:text-lg prose prose-invert prose-p:leading-relaxed prose-pre:bg-surface prose-pre:border prose-pre:border-surface-border max-w-none",
          !isUser && "font-serif text-white/90"
        )}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={message.content.length}
              initial={message.isStreaming ? { opacity: 0.8, y: 2 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Markdown>{message.content}</Markdown>
            </motion.div>
          </AnimatePresence>
          
          {message.isStreaming && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-1 h-5 sm:w-1.5 sm:h-6 ml-1 bg-accent-gold align-middle"
            />
          )}
        </div>

        {/* Citations / Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5 flex flex-wrap gap-1.5 sm:gap-2">
            {message.sources.map((source, idx) => (
              <button
                key={source.id}
                onClick={() => onCiteClick?.(source.id)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-white hover:border-accent-gold/50 transition-all"
              >
                <span className="text-accent-gold font-mono">[{idx + 1}]</span>
                <span className="truncate max-w-[100px] sm:max-w-[120px]">{source.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
