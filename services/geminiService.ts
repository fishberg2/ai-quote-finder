import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

// Data Structures
export interface Location {
  chapter?: string;
  page?: number;
  paragraph?: number;
}

export interface Section {
  summary: string;
  location: Location;
}

export interface Quote {
  quote: string;
  location: Location;
}

export const findSections = async (
  fileContent: string,
  bookVersion: string,
  quoteDescription: string
): Promise<Section[]> => {
    
  const systemInstruction = `You are an AI literary assistant. Your job is to analyze a document and identify sections relevant to a user's description. You must return your findings as a JSON array of objects. Each object must contain a 'summary' (a concise, one-sentence summary) and a 'location' object. The 'location' object should contain estimated 'chapter' (string or number) and 'page' (number) for where the section is. The document may contain page markers like '[Page X]'. Use these markers to determine page numbers.`;

  const userPrompt = `I have provided a document. Based on my description below, please identify up to 5 different sections where the described events might be taking place.

Description: "${quoteDescription}"
Book/File Version: ${bookVersion || 'Not specified'}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: userPrompt },
          { text: fileContent },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A concise, one-sentence summary of a relevant section." },
              location: {
                type: Type.OBJECT,
                properties: {
                  chapter: { type: Type.STRING, description: "The estimated chapter name or number." },
                  page: { type: Type.INTEGER, description: "The estimated page number." }
                },
                required: ["chapter", "page"]
              }
            },
            required: ["summary", "location"]
          }
        },
        temperature: 0.2,
      }
    });

    const jsonText = response.text.trim();
    const sections = JSON.parse(jsonText);

    if (!Array.isArray(sections)) {
      throw new Error("AI returned an invalid format for sections.");
    }

    return sections as Section[];

  } catch (error) {
    console.error("Error calling Gemini API for finding sections:", error);
    throw new Error("Failed to get response from AI model while identifying sections.");
  }
};


export const findQuoteInSection = async (
  fileContent: string,
  section: Section,
  originalQuoteDescription: string
): Promise<Quote | null> => {
  const systemInstruction = `You are an AI literary assistant. Your task is to find the single most relevant quote from a document based on a user's description and a specific section summary. The user's description may be a paraphrase or a general idea, not an exact match. Your goal is to interpret their intent and extract the passage that best captures the essence of their description.

RULES:
1. You MUST return a single JSON object with two properties: 'quote' and 'location'.
2. The 'quote' property should contain the full, continuous text of the passage.
3. The 'location' property must be an object containing the PRECISE 'chapter' (string), 'page' (number), and 'paragraph' (number) where the quote is found. The document may have markers like '[Page X]' to help you.
4. If no relevant quote can be found, return a JSON object with an empty string for the 'quote' property and null values for all location properties.`;

  const userPrompt = `I am looking for a quote. My description of it is: "${originalQuoteDescription}".

You have already identified a relevant section of the text, summarized as: "${section.summary}", located around chapter ${section.location.chapter}, page ${section.location.page}.

Please analyze the full document text, using this section as a strong hint for where to look. Find the single, most relevant quote that matches my description. Remember, my description is an interpretation.
Return a JSON object with the quote and its precise location.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: userPrompt },
          { text: fileContent },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                quote: { type: Type.STRING, description: "The full text of the found quote." },
                location: {
                    type: Type.OBJECT,
                    properties: {
                        chapter: { type: Type.STRING, description: "The chapter name or number." },
                        page: { type: Type.INTEGER, description: "The page number." },
                        paragraph: { type: Type.INTEGER, description: "The paragraph number on that page." }
                    },
                    required: ["chapter", "page", "paragraph"]
                }
            },
            required: ["quote", "location"]
        },
        temperature: 0.3,
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result && typeof result.quote === 'string') {
        return result as Quote;
    }

    return null;

  } catch (error) {
    console.error("Error calling Gemini API for finding a quote:", error);
    throw new Error("Failed to get response from AI model.");
  }
};
