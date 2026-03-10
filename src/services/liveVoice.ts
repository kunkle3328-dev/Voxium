import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { VoiceState } from "../types";

const apiKey = process.env.GEMINI_API_KEY as string;
const ai = new GoogleGenAI({ apiKey });

/**
 * Robust Audio Player for streaming PCM data.
 * Handles queuing, precise scheduling, and interruptions.
 */
class LiveAudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private sampleRate: number = 24000; // Gemini Live API default output rate
  private isDebug = true;

  constructor() {}

  private log(...args: any[]) {
    if (this.isDebug) console.log("[AudioPlayer]", ...args);
  }

  private initContext() {
    if (!this.audioContext) {
      this.log("Initializing AudioContext at", this.sampleRate, "Hz");
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate,
      });
    }
    return this.audioContext;
  }

  async playChunk(base64Data: string) {
    const ctx = this.initContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    
    try {
      // Decode base64 to Int16 PCM
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcmData = new Int16Array(bytes.buffer);
      
      // Convert Int16 to Float32
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768;
      }

      const buffer = ctx.createBuffer(1, floatData.length, this.sampleRate);
      buffer.getChannelData(0).set(floatData);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Precise scheduling for seamless stitching
      const now = ctx.currentTime;
      const startTime = Math.max(now, this.nextStartTime);
      
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;
      
      this.activeSources.add(source);
      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0 && ctx.currentTime >= this.nextStartTime) {
          this.nextStartTime = 0;
        }
      };
    } catch (e) {
      console.error("[AudioPlayer] Playback error", e);
    }
  }

  stop() {
    this.log("Stopping all playback, active sources:", this.activeSources.size);
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    this.activeSources.clear();
    this.nextStartTime = 0;
  }

  async resume() {
    const ctx = this.initContext();
    if (ctx.state === "suspended") {
      this.log("Resuming AudioContext");
      await ctx.resume();
    }
  }

  close() {
    this.log("Closing AudioPlayer");
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class LiveVoiceSession {
  private session: any = null;
  private audioPlayer: LiveAudioPlayer;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private inputAudioContext: AudioContext | null = null;
  private isDebug = true;

  constructor(
    private onTranscript: (text: string, role: "user" | "ai") => void,
    private onStateChange: (state: VoiceState) => void,
    private activeMode: string = "explore",
    private model: string = "gemini-2.5-flash-native-audio-preview-09-2025"
  ) {
    this.audioPlayer = new LiveAudioPlayer();
  }

  private log(...args: any[]) {
    if (this.isDebug) console.log("[LiveSession]", ...args);
  }

  async start(systemInstruction: string = "") {
    try {
      this.log("Starting session for mode:", this.activeMode);
      this.onStateChange("processing");

      // Initialize output audio context first (for mobile autoplay)
      await this.audioPlayer.resume();

      // Initialize input audio context (16kHz for Gemini)
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      
      // 4096 is a good buffer size for 16kHz
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      const speechConfig: any = {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      };

      // If in debate mode, attempt to use multi-speaker config if supported by Live API
      if (this.activeMode === "debate") {
        speechConfig.multiSpeakerVoiceConfig = {
          speakerVoiceConfigs: [
            { speaker: 'Dr. Aris Thorne', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
            { speaker: 'Sarah Jenkins', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: 'Marcus Vane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            { speaker: 'Elena Rodriguez', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
            { speaker: 'Moderator', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
          ]
        };
      }

      this.session = await ai.live.connect({
        model: this.model,
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig,
          inputAudioTranscription: {}, // Enable user transcription
        },
        callbacks: {
          onopen: () => {
            this.log("WebSocket opened");
            this.onStateChange("listening");
            this.startStreaming();
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message);
          },
          onclose: () => {
            this.log("WebSocket closed");
            this.onStateChange("stopped");
            this.stop();
          },
          onerror: (error) => {
            console.error("[Live] WebSocket error", error);
            this.onStateChange("error");
            this.stop();
          },
        },
      });
    } catch (err) {
      console.error("[Live] Failed to start session", err);
      this.onStateChange("error");
      this.stop();
    }
  }

  private startStreaming() {
    if (!this.processor || !this.source || !this.inputAudioContext) return;

    this.processor.onaudioprocess = (e) => {
      if (!this.session) return;

      const inputData = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      
      this.session.sendRealtimeInput({
        media: { data: base64Data, mimeType: "audio/pcm;rate=16000" }
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private handleMessage(message: LiveServerMessage) {
    const msg = message as any;

    // Handle model transcriptions
    if (msg.serverContent?.modelTurn?.parts) {
      const text = msg.serverContent.modelTurn.parts.map((p: any) => p.text).join("");
      if (text) this.onTranscript(text, "ai");
      
      const audioData = msg.serverContent.modelTurn.parts.find((p: any) => p.inlineData)?.inlineData?.data;
      if (audioData) {
        this.onStateChange("speaking");
        this.audioPlayer.playChunk(audioData);
      }
    }

    // Handle user transcription (inputAudioTranscription)
    if (msg.serverContent?.inputAudioTranscription?.text) {
      this.onTranscript(msg.serverContent.inputAudioTranscription.text, "user");
    }

    // Handle model transcription (outputAudioTranscription)
    if (msg.serverContent?.outputAudioTranscription?.text) {
      // We already handle modelTurn.parts for text, but this is another way
      // this.onTranscript(msg.serverContent.outputAudioTranscription.text, "ai");
    }

    if (msg.serverContent?.interrupted) {
      this.log("Interruption detected by model");
      this.audioPlayer.stop();
      this.onStateChange("interrupted");
      // Briefly show interrupted then back to listening
      setTimeout(() => {
        if (this.session) this.onStateChange("listening");
      }, 500);
    }

    if (message.serverContent?.turnComplete) {
      this.log("Turn complete");
      // We don't immediately set to listening because audio might still be playing
      // But we can signal that the model is done processing
    }
  }

  stop() {
    this.log("Stopping session and cleaning up resources");
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    this.audioPlayer.close();
  }
}
