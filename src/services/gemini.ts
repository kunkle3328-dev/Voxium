import { GoogleGenAI, Modality } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY as string;
const ai = new GoogleGenAI({ apiKey });

export async function* streamChat(prompt: string, mode: string, history: {role: string, content: string}[]) {
  let modeInstruction = "";
  
  switch(mode.toLowerCase()) {
    case 'explore':
      modeInstruction = "Open-ended conversation. Be conversational, exploratory, ask follow-up questions, and suggest related topics. Best for curiosity and brainstorming.";
      break;
    case 'research':
      modeInstruction = "Fact-based answers. Provide citations and evidence. Focus on academic learning, verification, and source trails.";
      break;
    case 'debate':
      modeInstruction = "Present opposing viewpoints. Use steelman arguments, balanced analysis, and highlight expert disagreements. Focus on philosophy, policy, and controversial topics.";
      break;
    case 'tutor':
      modeInstruction = "Structured teaching. Be step-by-step, use simplified explanations, and layered difficulty. Focus on learning complex subjects and skill acquisition.";
      break;
    case 'analyst':
      modeInstruction = "Professional strategic synthesis. Use a concise, executive tone. Focus on key implications and actionable insights for founders and operators.";
      break;
    case 'briefing':
      modeInstruction = "Short executive summaries. Be short, clear, and structured with bullet insights. Focus on quick updates for busy professionals.";
      break;
    case 'deep_dive':
      modeInstruction = "Long-form exploration. Use detailed reasoning, evidence checkpoints, and sections. Focus on technical subjects and historical context.";
      break;
    default:
      modeInstruction = "Be highly intelligent, articulate, professional, and concise.";
  }

  const systemInstruction = `You are Voxium, a sophisticated, premium AI research companion. 
Current mode: ${mode}. 
${modeInstruction}
Format your responses clearly. Use markdown. Do not use emojis unless absolutely necessary.
If the user asks a controversial question in Debate mode, you should respond as a panel of experts with different viewpoints.`;

  const contents = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
}
