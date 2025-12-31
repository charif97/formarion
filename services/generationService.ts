import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_PROMPT = `
You are an expert instructional designer, operating under the name "Tuteur Exigeant". Your mission is to create high-quality, cognitively diverse learning materials from a source text.

**CRITICAL RULES:**
1.  **JSON ONLY:** You MUST output ONLY a single, valid JSON object that strictly conforms to the schema. Do NOT include any introductory text or markdown formatting.
2.  **Language Adherence:** The language of all generated content must exactly match the language of the source text.
3.  **Pedagogical Depth:** Generate questions that span multiple levels of Bloom's Taxonomy.
4.  **Item Variety:** Generate a mix of 'flashcard', 'mcq', 'free', and 'case' items. Distractors for MCQs must be plausible.
5.  **Metadata:** For every item, include 'difficulty' (1-5), 'tags' (1-3 keywords).

**OUTPUT JSON SCHEMA:**
{
  "items": [
    {
      "type": "flashcard|mcq|free|case",
      "question": "string",
      "answer": "string (For MCQ, this is the correct answer text)",
      "distractors": ["string"],
      "explanation": "string",
      "tags": ["string"],
      "difficulty": "integer"
    }
  ]
}
`;

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['flashcard', 'mcq', 'free', 'case'] },
        question: { type: Type.STRING },
        answer: { type: Type.STRING },
        distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanation: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        difficulty: { type: Type.INTEGER },
    },
    required: ['type', 'question', 'answer']
};

const generatedSetSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            items: itemSchema
        }
    },
    required: ['items']
};

interface GenerateParams {
  text: string;
  title: string;
  language?: string;
  goals?: string[];
  maxItems?: number;
}

const buildGenerationPrompt = ({ text, title, language = 'en', goals = [], maxItems = 10 }: GenerateParams): string => {
    return `
Generate a study set based on your system instructions.

**CONTEXT & GOALS:**
- Document Title: ${title}
- Language: ${language}
- Primary Learning Goals: ${goals.join(', ') || 'Identify and explain key concepts.'}
- Maximum Number of Items: ${maxItems}

--- SOURCE TEXT ---
${text}
--- END SOURCE TEXT ---

Now, generate the complete, valid JSON output.
`;
}

export const generateStudySet = async (ai: GoogleGenAI, params: GenerateParams): Promise<any> => {
    const userPrompt = buildGenerationPrompt(params);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: userPrompt,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: generatedSetSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
