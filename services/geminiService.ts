import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Helper: Decode Base64 string to Uint8Array
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper: Decode Raw PCM Data to AudioBuffer
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // Convert Uint8Array (bytes) to Int16Array (PCM data)
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Generates and plays a welcome speech using Gemini TTS.
 */
export const playWelcomeMessage = async (): Promise<void> => {
  try {
    const script = `
      Welcome to Echomasters. 
      You have entered the theater of clinical excellence. 
      Here, we transform the ephemeral sounds of your lectures into lasting visual knowledge. 
      Do not merely listen; witness your curriculum come to life. 
      To begin the show, simply upload your audio recording below.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore has a nice, knowledgeable tone
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    // Audio Playback Logic using Web Audio API for raw PCM
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass({ sampleRate: 24000 });
    
    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();

  } catch (error) {
    console.error("Error generating welcome speech:", error);
    throw error;
  }
};

/**
 * Step 1: Analyze the audio file to get transcript, metadata, and storyboard prompts.
 */
export const analyzeAudio = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const modelId = "gemini-2.5-flash"; // Good for multimodal understanding (Audio/Video -> Text)
    
    const prompt = `
      Act as the charismatic host of "Echomasters: Sonography Songs & Lectures".
      
      **CORE DIRECTIVE: RAPID-FIRE VISUALS (MUSIC VIDEO STYLE)**
      You are creating a highly dynamic, fast-paced visual storyboard for a song or high-energy lecture (Audio or Video source).
      
      **CRITICAL TIMING RULE**: 
      - **Generate a new visual scene every 1.2 to 2.0 seconds.** 
      - For a 1-minute clip, I expect 30-40 distinct scenes.
      - Do NOT summarize. Visualize every single beat, lyric line, or concept immediately as it happens.
      
      **Transformation Rules**:
      1. **Tone**: Educational but engaging, using "Theater" or "Show" analogies.
      2. **If non-medical**: Create a medical metaphor (e.g., traffic = blood flow dynamics).
      3. **Visual Style**: Visuals should look like a **Vintage Educational Comic Book** or a **Chalkboard Lecture** happening on a stage.
      
      **GOAL**: Create a high-yield study guide that feels like a music video.

      1. **Transcribe** the spoken content from the media file.
      2. **Generate Metadata**: 
         - Title: Catchy, "Show Title" style.
         - Keywords: Medical terms.
      3. **Create a Full Medical Lesson Plan**:
         - **Topic**: Medical subject.
         - **Target Audience**: "Medical Students", "Sonographers".
         - **Learning Objectives**: 3-5 exam facts.
         - **Key Anatomical Structures**: List anatomy.
         - **Clinical Correlation**: Pathophysiology.
         - **Technique Tips**: Scanning advice.
         - **Community Discussion**: A "Cast Party" discussion topic.
         - **Quiz**: 3 Board-style questions.
      4. **Create a Visual Storyboard**: 
         - **Timestamps**: Must be precise (e.g., 1.5, 3.2, 4.8).
         - **Visual Prompt Engineering**: You are an illustrator for a vintage medical textbook or comic.
         - **Style Guide**: "Vintage comic book style", "Detailed line art with flat colors", "Chalkboard diagram background", "Professor character in white coat", "Stage lighting".
         - **Mandatory Content**:
           - **Scenes must include**: A Professor character explaining, Chalkboard diagrams, or "Simulated" Ultrasound screens with comic-book style labels.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            lesson: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                target_audience: { type: Type.STRING },
                learning_objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                anatomical_structures: { type: Type.ARRAY, items: { type: Type.STRING } },
                clinical_correlation: { type: Type.STRING },
                technique_tips: { type: Type.STRING },
                community_discussion: { type: Type.STRING },
                quiz: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            storyboard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.NUMBER, description: "Start time in seconds (e.g. 1.5)" },
                  caption: { type: Type.STRING },
                  visual_prompt: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing media:", error);
    throw error;
  }
};

/**
 * Step 2: Generate an image for a specific storyboard scene.
 */
export const generateImageForScene = async (visualPrompt: string): Promise<string> => {
  try {
    // Upgraded to gemini-3-pro-image-preview for high resolution output
    const modelId = "gemini-3-pro-image-preview";
    
    // Enhanced artistic prompt for Vintage Comic Book aesthetic
    const enhancedPrompt = `
      **Artistic Style Directive:**
      Create a high-resolution illustration in the style of a **Vintage 1980s Medical Comic Book**.
      
      **Visual Elements:**
      - **Line Work:** Bold, confident ink lines with dramatic cross-hatching for shadows.
      - **Color Palette:** Retro CMYK aesthetic - Muted mustard yellows, desaturated teals, brick reds, and aged paper cream textures.
      - **Lighting:** Dramatic "Film Noir" or "Stage" lighting with high contrast.
      - **Texture:** Subtle halftone dot patterns or paper grain.
      
      **Scene Content:**
      ${visualPrompt}
      
      **Requirements:**
      - Composition should be dynamic, like a graphic novel panel.
      - Anatomical details must be clear but stylized (schematic precision).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            text: enhancedPrompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K" // Requesting higher resolution (approx 1920x1080)
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");

  } catch (error) {
    console.error("Error generating image:", error);
    // Return a placeholder if generation fails
    return "https://picsum.photos/1920/1080?grayscale&blur=2"; 
  }
};