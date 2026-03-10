import { useState, useEffect, useRef } from "react";
import { AppMode, Message, VoiceState, Citation } from "../types";
import { APP_MODES, MOCK_CITATIONS } from "../constants";
import { streamChat, generateSpeech, spawnExpertPanel } from "../services/gemini";
import { LiveVoiceSession } from "../services/liveVoice";
import { VoiceOrb } from "../components/VoiceOrb";
import { TranscriptMessage } from "../components/TranscriptMessage";
import { ModeSelector } from "../components/ModeSelector";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Layers, 
  Share2, 
  Settings, 
  Send, 
  Square, 
  Loader2, 
  Sparkles, 
  Play, 
  Pause, 
  MessageSquare 
} from "lucide-react";

interface ConversationProps {
  initialMode: AppMode;
  initialPrompt?: string;
  onBack: () => void;
}

export function Conversation({ initialMode, initialPrompt, onBack }: ConversationProps) {
  const [activeMode, setActiveMode] = useState<AppMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [inputText, setInputText] = useState("");
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastAudioData, setLastAudioData] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<LiveVoiceSession | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
    } else if (lastAudioData) {
      playAudio(lastAudioData);
    }
  };

  const playAudio = async (base64Data: string) => {
    setLastAudioData(base64Data);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      
      stopAudio();

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
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

    const history = messages
      .filter(m => m.content.trim() !== "" && !m.isLoading)
      .map(m => ({ role: m.role, content: m.content }));
    
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setVoiceState("processing");

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: "ai",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        sources: Math.random() > 0.5 ? MOCK_CITATIONS : [], // Randomly show citations for demo
      },
    ]);

    try {
      const modeName = APP_MODES.find(m => m.id === activeMode)?.name || 'Explore';
      
      let fullResponse = "";
      
      // Trigger Expert Panel if in Debate mode and it's a new topic or explicitly requested
      if (activeMode === "debate" && (messages.length < 2 || text.toLowerCase().includes("panel") || text.toLowerCase().includes("debate"))) {
        const stream = spawnExpertPanel(text);
        for await (const chunk of stream) {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, content: fullResponse } : msg
            )
          );
        }
      } else {
        const stream = streamChat(text, modeName, history);
        for await (const chunk of stream) {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, content: fullResponse } : msg
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      // If voice mode was active (or just generally), generate speech
      // For this demo, we'll generate speech if not muted
      if (!isMuted) {
        setVoiceState("processing");
        const audio = await generateSpeech(fullResponse, activeMode === "debate");
        if (audio) {
          playAudio(audio);
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
          msg.id === aiMsgId ? { ...msg, content: "I encountered an error processing that request. Please ensure your API key is correctly configured.", isStreaming: false } : msg
        )
      );
      setVoiceState("idle");
    }
  };

  const toggleVoice = async () => {
    if (isLiveMode) {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setIsLiveMode(false);
      setVoiceState("idle");
      return;
    }

    if (voiceState === "listening") {
      setVoiceState("idle");
      return;
    }

    // If user holds or double clicks or we just have a toggle for "Live"
    // For now, let's make the Mic button toggle Live mode if it's already idle
    
    const startLive = async () => {
      setIsLiveMode(true);
      const session = new LiveVoiceSession(
        (text, role) => {
          const id = Date.now().toString();
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === role && role === "ai") {
              return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + " " + text }];
            }
            return [...prev, { id, role, content: text, timestamp: new Date() }];
          });
        },
        (state) => setVoiceState(state),
        activeMode
      );
      
      liveSessionRef.current = session;
      const systemInstruction = `You are Voxium, a sophisticated AI research companion. 
Current mode: ${activeMode}. 
Be highly intelligent, articulate, and concise. 
In debate mode, you act as a panel of experts, responding with different viewpoints in a single stream.`;
      
      await session.start(systemInstruction);
    };

    // Standard STT if not wanting Live, but let's default to Live for this request
    await startLive();
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden selection:bg-accent-gold/30">
      {/* Evidence Sidebar / Drawer */}
      <AnimatePresence>
        {isEvidenceOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] lg:w-[500px] glass-panel z-50 border-l border-white/10 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="text-accent-gold" size={20} />
                <h3 className="font-display font-bold text-lg uppercase tracking-widest text-white">Evidence Layer</h3>
              </div>
              <button 
                onClick={() => setIsEvidenceOpen(false)}
                className="p-2 rounded-xl hover:bg-white/5 text-text-muted transition-all"
              >
                <ArrowLeft size={20} className="rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Active Citations</p>
                {MOCK_CITATIONS.map((citation) => (
                  <div key={citation.id} className="glass-card rounded-2xl p-5 space-y-3 group border-white/5 hover:border-accent-gold/30 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-accent-gold/10 text-accent-gold text-[8px] font-bold uppercase tracking-widest">
                        {citation.type}
                      </span>
                      <span className="text-[10px] text-text-muted font-medium">{citation.freshness}</span>
                    </div>
                    <h4 className="text-white font-medium group-hover:text-accent-gold transition-colors">{citation.title}</h4>
                    <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 italic">"{citation.snippet}"</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-gold" style={{ width: `${citation.confidence * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-text-muted font-bold">{Math.round(citation.confidence * 100)}% Confidence</span>
                      </div>
                      <a href={citation.url} target="_blank" className="text-[10px] text-accent-gold font-bold uppercase tracking-widest hover:underline">View Source</a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Topic Map</p>
                <div className="aspect-square rounded-3xl bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                  <p className="text-text-muted text-xs font-light italic">Visual knowledge graph generating...</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-14 md:h-16 border-b border-white/5 glass-panel flex items-center justify-between px-3 md:px-4 shrink-0 z-30">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/5 text-text-secondary transition-all active:scale-95"
            >
              <ArrowLeft className="w-[18px] h-[18px] md:w-5 md:h-5" />
            </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="text-accent-gold w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="font-display font-bold text-xs md:text-sm tracking-tight text-white">
                    Voxium
                  </span>
                  {isLiveMode && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-1.5 py-0.5 rounded bg-rose-500 text-[8px] font-bold text-white uppercase tracking-widest flex items-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      Live
                    </motion.span>
                  )}
                </div>
                <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-text-muted font-bold">
                  {activeMode === "debate" ? "Multi-Expert Panel Active" : "Intelligence Active"}
                </span>
              </div>
          </div>

          <div className="hidden lg:block flex-1 max-w-xl mx-8">
            <ModeSelector
              activeMode={activeMode}
              onSelectMode={setActiveMode}
            />
          </div>

          <div className="flex items-center gap-0.5 md:gap-1">
            <button
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-all relative active:scale-95",
                isEvidenceOpen
                  ? "bg-accent-gold/20 text-accent-gold"
                  : "hover:bg-white/5 text-text-secondary",
              )}
            >
              <Layers className="w-[18px] h-[18px] md:w-5 md:h-5" />
              {MOCK_CITATIONS.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </button>
            <button className="p-2 md:p-2.5 rounded-xl hover:bg-white/5 text-text-secondary hidden sm:block">
              <Share2 className="w-[18px] h-[18px] md:w-5 md:h-5" />
            </button>
            <button className="p-2 md:p-2.5 rounded-xl hover:bg-white/5 text-text-secondary">
              <Settings className="w-[18px] h-[18px] md:w-5 md:h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Mode Selector - Native Feel */}
        <div className="lg:hidden border-b border-white/5 bg-surface/30 px-3 py-2 shrink-0 relative">
          <ModeSelector activeMode={activeMode} onSelectMode={setActiveMode} />
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative overscroll-contain scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* Background Atmospheric Effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent-violet/5 blur-[80px] md:blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-accent-cyan/5 blur-[70px] md:blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="max-w-3xl mx-auto space-y-4 pb-48 md:pb-64 relative z-10">
            {messages.length === 0 && (
              <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6 md:space-y-8">
                <button 
                  onClick={toggleVoice}
                  className="relative group active:scale-95 transition-transform"
                >
                  <VoiceOrb state={voiceState} className="w-40 h-40 md:w-48 md:h-48" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Mic className="text-white w-6 h-6" />
                  </div>
                </button>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 md:space-y-4"
                >
                  <h2 className="font-serif italic text-3xl md:text-4xl text-white/40">Ready to listen...</h2>
                  <p className="text-text-muted uppercase tracking-[0.3em] text-[8px] md:text-[10px] font-bold">Voxium Intelligence Active</p>
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
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 lg:p-6 bg-gradient-to-t from-background via-background/95 to-transparent pt-16 md:pt-24 z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 md:mb-6 pb-1">
              {["Simplify", "Go Deeper", "Summarize", "Challenge This"].map(
                (action) => (
                  <button
                    key={action}
                    onClick={() => handleSend(action)}
                    className="px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border border-white/5 bg-white/[0.03] text-text-secondary hover:text-white hover:border-accent-gold/50 whitespace-nowrap backdrop-blur-xl transition-all active:scale-95"
                  >
                    {action}
                  </button>
                ),
              )}
            </div>

            {/* Main Control Bar */}
            <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-1.5 md:p-2 flex items-center gap-2 md:gap-3 shadow-2xl border border-white/10 backdrop-blur-3xl ring-1 ring-white/5">
              {/* Voice Toggle */}
              <button
                onClick={toggleVoice}
                className={cn(
                  "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 shrink-0 active:scale-90",
                  voiceState === "listening" || isLiveMode
                    ? "bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-105 md:scale-110"
                    : "bg-white text-black hover:bg-accent-gold hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]",
                )}
              >
                {isLiveMode ? (
                  <Square className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                ) : (
                  <Mic className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative flex items-center bg-white/[0.03] rounded-2xl md:rounded-3xl px-3 md:px-5 h-11 md:h-14 border border-white/5 focus-within:border-accent-gold/50 transition-all duration-500 group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
                  placeholder="Inquire further..."
                  className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-text-primary placeholder:text-text-muted font-light"
                />
                <button
                  onClick={() => handleSend(inputText)}
                  disabled={!inputText.trim()}
                  className="absolute right-1 md:right-2 p-2 rounded-xl text-text-muted hover:text-accent-gold disabled:opacity-50 transition-all active:scale-90"
                >
                  {voiceState === "processing" ? <Loader2 className="w-4 h-4 md:w-[18px] md:h-[18px] animate-spin text-accent-gold" /> : <Send className="w-4 h-4 md:w-[18px] md:h-[18px]" />}
                </button>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-0.5 md:gap-1 px-1 md:px-2 shrink-0 border-l border-white/10">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn("p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-90", isMuted ? "text-rose-400 bg-rose-400/10" : "text-text-muted hover:text-white hover:bg-white/5")}
                >
                  {isMuted ? <MicOff className="w-[18px] h-[18px] md:w-5 md:h-5" /> : <MessageSquare className="w-[18px] h-[18px] md:w-5 md:h-5" />}
                </button>
                <button
                  onClick={togglePlayback}
                  disabled={!audioSourceRef.current && !lastAudioData}
                  className="p-2 md:p-3 rounded-xl md:rounded-2xl text-text-muted hover:text-white hover:bg-white/5 transition-all duration-300 disabled:opacity-20 active:scale-90"
                >
                  {isPlaying ? <Pause className="w-[18px] h-[18px] md:w-5 md:h-5" /> : <Play className="w-[18px] h-[18px] md:w-5 md:h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
