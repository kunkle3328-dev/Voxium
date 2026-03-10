import { ModeConfig, Citation } from "./types";

export const APP_MODES: ModeConfig[] = [
  {
    id: "explore",
    name: "Explore",
    description: "Open-ended conversation to brainstorm and discover ideas.",
    icon: "Compass",
  },
  {
    id: "research",
    name: "Research",
    description: "Fact-based answers with citations and source trails.",
    icon: "Search",
  },
  {
    id: "debate",
    name: "Debate",
    description: "Presents opposing viewpoints and balanced analysis.",
    icon: "Scale",
  },
  {
    id: "tutor",
    name: "Tutor",
    description: "Structured teaching with step-by-step explanations.",
    icon: "BookOpen",
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "Professional strategic synthesis with actionable insights.",
    icon: "BarChart3",
  },
  {
    id: "briefing",
    name: "Briefing",
    description: "Short executive summaries for quick updates.",
    icon: "Zap",
  },
  {
    id: "deep_dive",
    name: "Deep Dive",
    description: "Long-form exploration with detailed reasoning.",
    icon: "Layers",
  },
];

export const MOCK_CITATIONS: Citation[] = [
  {
    id: "1",
    title: "The Future of Fusion Energy",
    url: "https://example.com/fusion",
    snippet: "Recent breakthroughs in magnetic confinement have led to record-breaking energy yields.",
    confidence: 0.95,
    freshness: "2 days ago",
    type: "article",
  },
  {
    id: "2",
    title: "Universal Basic Income: A Global Perspective",
    url: "https://example.com/ubi",
    snippet: "Studies from various pilot programs suggest that UBI can improve mental health and financial stability.",
    confidence: 0.88,
    freshness: "1 week ago",
    type: "paper",
  },
];
