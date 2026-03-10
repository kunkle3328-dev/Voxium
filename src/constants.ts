import { AppMode, ModeConfig } from "./types";
import {
  Compass,
  Search,
  Swords,
  GraduationCap,
  LineChart,
  FileText,
  Layers,
} from "lucide-react";

export const APP_MODES: ModeConfig[] = [
  {
    id: "explore",
    name: "Explore",
    description: "Open-ended conversation on any topic.",
    icon: "Compass",
  },
  {
    id: "research",
    name: "Research",
    description: "Grounded answers with citations and source trails.",
    icon: "Search",
  },
  {
    id: "debate",
    name: "Debate",
    description: "Presents opposing views and challenges assumptions.",
    icon: "Swords",
  },
  {
    id: "tutor",
    name: "Tutor",
    description: "Teaches concepts step-by-step with patience.",
    icon: "GraduationCap",
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "Concise, professional synthesis of complex data.",
    icon: "LineChart",
  },
  {
    id: "briefing",
    name: "Briefing",
    description: "Spoken executive summary of key points.",
    icon: "FileText",
  },
  {
    id: "deep_dive",
    name: "Deep Dive",
    description: "Long-form reasoning with evidence checkpoints.",
    icon: "Layers",
  },
];
