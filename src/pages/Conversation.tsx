import { useState, useEffect, useRef } from "react";
import { AppMode, Message, VoiceState, Citation } from "../types";
import { APP_MODES } from "../constants";
import { VoiceOrb } from "../components/VoiceOrb";
import { ModeSelector } from "../components/ModeSelector";
import { TranscriptMessage } from "../components/TranscriptMessage";
import { EvidencePanel } from "../components/EvidencePanel";
import { motion, AnimatePresence } from "motion/react";
import { streamChat, generateSpeech } from "../services/gemini";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  MessageSquare,
  Layers,
  ArrowLeft,
  Send,
  Settings,
  Share2,
  Download,
  Sparkles,
  Loader2
} from "lucide-react";
import { cn } from "../utils/cn";

interface ConversationProps {
  initialMode: AppMode;
  initialPrompt?: string;
  onBack: () => void;
}

// Mock Data
const MOCK_CITATIONS: Citation[] = [
  {
    id: "c1",
    title: "Quantum Advantage in Machine Learning",
    url: "https://nature.com/articles/s41586-021-00000-0",
    snippet:
      "Recent advancements show exponential speedups in specific classification tasks using quantum kernels.",
    confidence: 0.95,
    freshness: "2 days ago",
    type: "paper",
  },
  {
    id: "c2",
    title: "State of AI Report 2026",
    url: "https://stateof.ai/2026",
    snippet:
      "The integration of voice-first interfaces has shifted the paradigm from search to conversation.",
    confidence: 0.88,
    freshness: "1 week ago",
    type: "article",
  },
];

export function Conversation({
  initialMode,
  initialPrompt,
  onBack,
}: ConversationProps) {
  const [activeMode, setActiveMode] = useState<AppMode>(initialMode);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    } else {
      setVoiceState("speaking");
      setMessages([
        {
          id: "0",
          role: "ai",
          content: `Hello. I'm ready to explore topics in ${APP_MODES.find((m) => m.id === initialMode)?.name} mode. What would you like to discuss?`,
          timestamp: new Date(),
          isStreaming: false,
        },
      ]);
      setTimeout(() => setVoiceState("idle"), 3000);
    }
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      audioSourceRef.current = null;
    }
    setVoiceState("idle");
    setIsPlaying(false);
  };

  const playAudio = async (base64Audio: string) => {
    if (isMuted) return;
    
    try {
      // Stop any existing audio
      stopAudio();

      // Initialize AudioContext lazily
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const context = audioContextRef.current;

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini TTS returns 16-bit PCM at 24kHz
      // Each sample is 2 bytes
      const numSamples = bytes.length / 2;
      const audioBuffer = context.createBuffer(1, numSamples, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(bytes.buffer);

      for (let i = 0; i < numSamples; i++) {
        // Read 16-bit signed integer (little-endian) and normalize to [-1, 1]
        channelData[i] = dataView.getInt16(i * 2, true) / 32768;
      }

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      
      source.onended = () => {
        if (audioSourceRef.current === source) {
          setVoiceState("idle");
          setIsPlaying(false);
          audioSourceRef.current = null;
        }
      };

      audioSourceRef.current = source;
      setVoiceState("speaking");
      setIsPlaying(true);
      source.start();
    } catch (err) {
      console.error("Failed to play audio", err);
      setVoiceState("idle");
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Stop any playing audio
    stopAudio();

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setVoiceState("thinking");

    // Check if we should trigger multi-expert panel
    const isDebateMode = activeMode === "debate";
    const isControversial = text.toLowerCase().includes("should") || text.toLowerCase().includes("exist") || text.toLowerCase().includes("debate") || text.toLowerCase().includes("viable");

    if (isDebateMode && isControversial) {
      // Multi-expert panel logic
      const experts = [
        { name: "Moderator", instruction: "Introduce the topic and the panel of experts. Keep it brief." },
        { name: "Economist", instruction: "Provide an economic perspective on the topic. Be analytical." },
        { name: "Policy Analyst", instruction: "Provide a policy-focused perspective. Be practical." },
        { name: "Libertarian", instruction: "Provide a libertarian perspective. Focus on individual liberty." },
        { name: "Progressive", instruction: "Provide a progressive perspective. Focus on social equity." }
      ];

      for (const expert of experts) {
        const aiMsgId = (Date.now() + Math.random()).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: "ai",
            content: "",
            timestamp: new Date(),
            isStreaming: true,
            expertName: expert.name,
          },
        ]);

        try {
          const expertPrompt = `Respond as the ${expert.name} AI. ${expert.instruction} Topic: ${text}`;
          const stream = streamChat(expertPrompt, "Debate", history);
          
          let fullResponse = "";
          for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: fullResponse } : msg
              )
            );
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
            )
          );

          // Add to history for next expert
          history.push({ role: "ai", content: `${expert.name}: ${fullResponse}` });

          // Small delay between experts
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Expert ${expert.name} error:`, error);
        }
      }
      setVoiceState("idle");
      return;
    }

    // Normal single-expert logic
    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: "ai",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        sources: Math.random() > 0.5 ? MOCK_CITATIONS : [],
      },
    ]);

    try {
      const modeName = APP_MODES.find(m => m.id === activeMode)?.name || 'Explore';
      const stream = streamChat(text, modeName, history);
      
      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, content: fullResponse } : msg
          )
        );
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      if (!isMuted) {
        setVoiceState("thinking");
        const audioData = await generateSpeech(fullResponse);
        if (audioData) {
          playAudio(audioData);
        } else {
          setVoiceState("idle");
        }
      } else {
        setVoiceState("idle");
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, content: "I encountered an error processing that request.", isStreaming: false } : msg
        )
      );
      setVoiceState("idle");
    }
  };

  // Simple Web Speech API for STT
  const toggleVoice = () => {
    if (voiceState === "listening") {
      setVoiceState("idle");
      return;
    }

    stopAudio();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setVoiceState("listening");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setVoiceState("idle");
    };

    recognition.onend = () => {
      setVoiceState((current) => {
        if (current === "listening") {
          return "idle";
        }
        return current;
      });
    };

    recognition.start();
  };

  const togglePlayback = () => {
    if (audioSourceRef.current) {
      if (isPlaying) {
        // We can't easily pause a BufferSource, so we just stop it
        stopAudio();
      }
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col lg:flex-row bg-background overflow-hidden relative selection:bg-accent-gold/30">
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-14 sm:h-16 border-b border-white/5 glass-panel flex items-center justify-between px-3 sm:px-4 shrink-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/5 text-text-secondary transition-all active:scale-95"
            >
              <ArrowLeft size={18} className="sm:size-[20px]" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Sparkles className="text-accent-gold sm:size-[14px]" size={12} />
                <span className="font-display font-bold text-xs sm:text-sm tracking-tight text-white">
                  Voxium
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-text-muted font-bold">
                Intelligence Active
              </span>
            </div>
          </div>

          <div className="hidden lg:block flex-1 max-w-xl mx-8">
            <ModeSelector
              activeMode={activeMode}
              onSelectMode={setActiveMode}
            />
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
              className={cn(
                "p-2 rounded-xl transition-all relative active:scale-95",
                isEvidenceOpen
                  ? "bg-accent-gold/20 text-accent-gold"
                  : "hover:bg-white/5 text-text-secondary",
              )}
            >
              <Layers size={18} className="sm:size-[20px]" />
              {MOCK_CITATIONS.length > 0 && (
                <span className="absolute top-2 right-2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </button>
            <button className="p-2 rounded-xl hover:bg-white/5 text-text-secondary hidden sm:block">
              <Share2 size={18} className="sm:size-[20px]" />
            </button>
            <button className="p-2 rounded-xl hover:bg-white/5 text-text-secondary">
              <Settings size={18} className="sm:size-[20px]" />
            </button>
          </div>
        </header>

        {/* Mobile Mode Selector - Native Feel */}
        <div className="lg:hidden border-b border-white/5 bg-surface/30 px-3 sm:px-4 py-2 sm:py-3 shrink-0 overflow-x-auto no-scrollbar">
          <ModeSelector activeMode={activeMode} onSelectMode={setActiveMode} />
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 no-scrollbar relative overscroll-contain">
          {/* Background Atmospheric Effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-accent-violet/5 blur-[80px] sm:blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-accent-cyan/5 blur-[70px] sm:blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-48 sm:pb-64 relative z-10">
            {messages.length === 0 && (
              <div className="h-[40vh] sm:h-[50vh] flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
                <VoiceOrb state={voiceState} className="w-32 h-32 sm:w-48 sm:h-48" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <h2 className="font-serif italic text-2xl sm:text-4xl text-white/40">Ready to listen...</h2>
                  <p className="text-text-muted uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-[10px] font-bold">Voxium Intelligence Active</p>
                </motion.div>
              </div>
            )}
            {messages.map((msg) => (
              <TranscriptMessage
                key={msg.id}
                message={msg}
                onCiteClick={() => setIsEvidenceOpen(true)}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Bottom Controls - Native Mobile Feel */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 bg-gradient-to-t from-background via-background/95 to-transparent pt-16 sm:pt-24 z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            {/* Quick Actions */}
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar mb-4 sm:mb-6 pb-1">
              {["Simplify", "Go Deeper", "Summarize", "Challenge This"].map(
                (action) => (
                  <button
                    key={action}
                    onClick={() => handleSend(action)}
                    className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border border-white/5 bg-white/[0.03] text-text-secondary hover:text-white hover:border-accent-gold/50 whitespace-nowrap backdrop-blur-xl transition-all active:scale-95"
                  >
                    {action}
                  </button>
                ),
              )}
            </div>

            {/* Main Control Bar */}
            <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 flex items-center gap-2 sm:gap-3 shadow-2xl border border-white/10 backdrop-blur-3xl ring-1 ring-white/5">
              {/* Voice Toggle */}
              <button
                onClick={toggleVoice}
                className={cn(
                  "w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 shrink-0 active:scale-90",
                  voiceState === "listening"
                    ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] sm:shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-105 sm:scale-110"
                    : "bg-white text-black hover:bg-accent-gold hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] sm:shadow-[0_0_20px_rgba(255,255,255,0.1)]",
                )}
              >
                {voiceState === "listening" ? (
                  <Square size={16} className="sm:size-[20px]" fill="currentColor" />
                ) : (
                  <Mic size={20} className="sm:size-[24px]" />
                )}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative flex items-center bg-white/[0.03] rounded-2xl sm:rounded-3xl px-3 sm:px-5 h-11 sm:h-14 border border-white/5 focus-within:border-accent-gold/50 transition-all duration-500 group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
                  placeholder="Inquire further..."
                  className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-text-primary placeholder:text-text-muted font-light"
                />
                <button
                  onClick={() => handleSend(inputText)}
                  disabled={!inputText.trim()}
                  className="absolute right-1 sm:right-2 p-2 rounded-xl text-text-muted hover:text-accent-gold disabled:opacity-50 transition-all active:scale-90"
                >
                  {voiceState === "thinking" ? <Loader2 size={16} className="animate-spin text-accent-gold sm:size-[18px]" /> : <Send size={16} className="sm:size-[18px]" />}
                </button>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 shrink-0 border-l border-white/10">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn("p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 active:scale-90", isMuted ? "text-rose-400 bg-rose-400/10" : "text-text-muted hover:text-white hover:bg-white/5")}
                >
                  {isMuted ? <MicOff size={18} className="sm:size-[20px]" /> : <MessageSquare size={18} className="sm:size-[20px]" />}
                </button>
                <button
                  onClick={togglePlayback}
                  disabled={!audioSourceRef.current}
                  className="p-2 sm:p-3 rounded-xl sm:rounded-2xl text-text-muted hover:text-white hover:bg-white/5 transition-all duration-300 disabled:opacity-20 active:scale-90"
                >
                  {isPlaying && audioSourceRef.current ? <Pause size={18} className="sm:size-[20px]" /> : <Play size={18} className="sm:size-[20px]" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Panel Drawer */}
      <EvidencePanel
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        citations={MOCK_CITATIONS}
      />
    </div>
  );
}
