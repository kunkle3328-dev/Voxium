export type AppMode =
  | "explore"
  | "research"
  | "debate"
  | "tutor"
  | "analyst"
  | "briefing"
  | "deep_dive";

export interface ModeConfig {
  id: AppMode;
  name: string;
  description: string;
  icon: string;
}

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: Citation[];
  isStreaming?: boolean;
  expertName?: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
  confidence: number;
  freshness: string; // e.g., "2 days ago"
  type: "article" | "paper" | "news" | "data";
}

export interface Session {
  id: string;
  title: string;
  date: Date;
  mode: AppMode;
  messages: Message[];
  takeaways: string[];
}
