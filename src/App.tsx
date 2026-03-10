import { useState } from "react";
import { AppMode } from "./types";
import { Home } from "./pages/Home";
import { Conversation } from "./pages/Conversation";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [view, setView] = useState<"home" | "conversation">("home");
  const [activeMode, setActiveMode] = useState<AppMode>("explore");
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();

  const handleStartConversation = (mode: AppMode, prompt?: string) => {
    setActiveMode(mode);
    setInitialPrompt(prompt);
    setView("conversation");
  };

  const handleBack = () => {
    setView("home");
    setInitialPrompt(undefined);
  };

  return (
    <main className="min-h-screen bg-background text-text-primary font-sans selection:bg-accent-gold/30">
      <AnimatePresence mode="wait">
        {view === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Home onStartConversation={handleStartConversation} />
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Conversation 
              initialMode={activeMode} 
              initialPrompt={initialPrompt} 
              onBack={handleBack} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
