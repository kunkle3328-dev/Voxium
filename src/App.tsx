import { useState } from "react";
import { Home } from "./pages/Home";
import { Conversation } from "./pages/Conversation";
import { AppMode } from "./types";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "conversation">(
    "home",
  );
  const [activeMode, setActiveMode] = useState<AppMode>("explore");
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();

  const handleStartConversation = (mode: AppMode, prompt?: string) => {
    setActiveMode(mode);
    setInitialPrompt(prompt);
    setCurrentScreen("conversation");
  };

  const handleBackToHome = () => {
    setCurrentScreen("home");
    setInitialPrompt(undefined);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Home onStartConversation={handleStartConversation} />
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Conversation
              initialMode={activeMode}
              initialPrompt={initialPrompt}
              onBack={handleBackToHome}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
