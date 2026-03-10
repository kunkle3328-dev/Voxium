import { GoogleGenAI, Modality } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY as string;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment. Please ensure it is set in the Settings menu.");
}
const ai = new GoogleGenAI({ apiKey });

export async function* streamChat(prompt: string, mode: string, history: {role: string, content: string}[]) {
  const systemInstruction = `You are Voxium, a sophisticated, premium AI research companion. 
Current mode: ${mode}. 
Be highly intelligent, articulate, professional, and concise. 
Format your responses clearly. Use markdown. Do not use emojis unless absolutely necessary.`;

  const contents = [];
  let lastRole = null;

  for (const msg of history) {
    const role = msg.role === 'ai' ? 'model' : 'user';
    if (role === lastRole) continue; // Skip consecutive messages with same role
    if (msg.content.trim() === "") continue; // Skip empty messages
    
    contents.push({
      role,
      parts: [{ text: msg.content }]
    });
    lastRole = role;
  }
  
  // Ensure the last message in history is not 'user' if we are about to push the current 'user' prompt
  if (lastRole === 'user') {
    // This shouldn't happen with normal chat flow, but just in case
    // We could either merge them or skip the last one.
    // For now, let's just ensure we don't push two users in a row.
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  }

  // Final check: if contents is empty or last is not user, ensure we have at least the prompt
  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        // already handled
    } else {
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });
    }
  }

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

export async function* spawnExpertPanel(topic: string) {
  const personas = [
    { name: "Dr. Aris Thorne", role: "Economist", style: "Data-driven, focused on fiscal impact and market dynamics." },
    { name: "Sarah Jenkins", role: "Policy Analyst", style: "Pragmatic, focused on implementation challenges and social outcomes." },
    { name: "Marcus Vane", role: "Libertarian Thinker", style: "Principled, focused on individual liberty and minimal state intervention." },
    { name: "Elena Rodriguez", role: "Progressive Advocate", style: "Passionate, focused on equity, systemic justice, and community impact." }
  ];

  const moderatorInstruction = `You are the Moderator of a high-level expert panel. 
The topic is: "${topic}". 
Introduce the panel briefly, then call on each expert one by one to give their opening statement. 
After all have spoken, provide a concise synthesis of the key disagreements and consensus points.`;

  // 1. Moderator Introduction
  yield `### Expert Panel: ${topic}\n\n**Moderator:** Welcome to today's session. We are joined by four distinguished experts to discuss: *${topic}*. Let's begin with opening statements.\n\n---\n\n`;

  for (const persona of personas) {
    yield `**${persona.name} (${persona.role}):** `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: `You are ${persona.name}, a ${persona.role}. Your style is ${persona.style}. 
Provide a concise opening statement (2-3 sentences) on the topic: "${topic}". 
Be distinct and stay in character.` }] }],
    });
    
    yield (response.text || "I have no comment at this time.") + "\n\n";
  }

  // 2. Moderator Summary
  yield `\n---\n\n**Moderator Summary:** `;
  const summaryResponse = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ role: 'user', parts: [{ text: `Summarize the key points of disagreement and consensus based on the topic "${topic}" and the likely positions of an Economist, Policy Analyst, Libertarian, and Progressive. 
Be objective and sharp.` }] }],
  });
  yield summaryResponse.text || "The panel has concluded.";
}

export async function generateSpeech(text: string, isDebate: boolean = false): Promise<string | null> {
  try {
    const config: any = {
      responseModalities: [Modality.AUDIO],
    };

    if (isDebate && text.includes("**")) {
      // Attempt to identify speakers for multi-speaker TTS
      // This is a heuristic for the demo
      config.speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Dr. Aris Thorne', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
            { speaker: 'Sarah Jenkins', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: 'Marcus Vane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            { speaker: 'Elena Rodriguez', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
            { speaker: 'Moderator', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
          ]
        }
      };
    } else {
      config.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: isDebate ? `TTS the following conversation with appropriate speakers: ${text}` : text }] }],
      config,
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
}
