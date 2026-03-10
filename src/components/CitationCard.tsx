import { Citation } from "../types";
import {
  ExternalLink,
  Clock,
  ShieldCheck,
  FileText,
  Newspaper,
  Database,
  GraduationCap,
} from "lucide-react";
import { cn } from "../utils/cn";

interface CitationCardProps {
  key?: string | number;
  citation: Citation;
  className?: string;
  onClick?: () => void;
}

export function CitationCard({
  citation,
  className,
  onClick,
}: CitationCardProps) {
  const getIcon = (type: Citation["type"]) => {
    switch (type) {
      case "article":
        return <FileText size={14} />;
      case "news":
        return <Newspaper size={14} />;
      case "data":
        return <Database size={14} />;
      case "paper":
        return <GraduationCap size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  const confidenceColor =
    citation.confidence >= 0.9
      ? "text-emerald-400"
      : citation.confidence >= 0.7
        ? "text-accent-gold"
        : "text-rose-400";

  return (
    <div
      className={cn(
        "group relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-gold/30 transition-all duration-500 cursor-pointer overflow-hidden",
        className,
      )}
      onClick={onClick}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-accent-gold">
            <div className="p-1.5 rounded-lg bg-accent-gold/10">
              {getIcon(citation.type)}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
              {citation.type}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-1 text-[10px] font-mono", confidenceColor)}>
              <ShieldCheck size={12} />
              {Math.round(citation.confidence * 100)}%
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-serif italic text-white leading-snug group-hover:text-accent-gold transition-colors">
            {citation.title}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 font-light">
            "{citation.snippet}"
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
              {new URL(citation.url).hostname}
            </span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
              {citation.freshness}
            </span>
          </div>
          <ExternalLink
            size={12}
            className="text-text-muted group-hover:text-accent-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
