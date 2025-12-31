import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_PROMPT = `
You are an expert instructional designer, operating under the name "Tuteur Exigeant". Your mission is to create high-quality, cognitively diverse learning materials from a source text.

**CRITICAL RULES:**
1.  **JSON ONLY:** You MUST output ONLY a single, valid JSON object that strictly conforms to the schema. Do NOT include any introductory text or markdown formatting.
2.  **Language Adherence:** The language of all generated content, and the top-level "language" field, must exactly match the language of the source text.
3.  **Pedagogical Depth:** Generate questions that span multiple levels of Bloom's Taxonomy.
4.  **Item Variety:** Generate a mix of 'flashcard', 'mcq', 'free', and 'case' items. Distractors for MCQs must be plausible.
5.  **Metadata:** For every item, you MUST include:
    -   'difficulty': An integer from 1 (very easy) to 5 (very complex).
    -   'tags': An array of 1-3 relevant keywords (in the source language).
    -   'source_spans': If an answer is directly found in the text, provide character indices \`{"start": 0, "end": 123}\`. Omit if the item is a synthesis of multiple sources.
6.  **Top-Level Fields**: The final JSON object must include "doc_title" and "language" at the root level.

**OUTPUT JSON SCHEMA:**
{
  "doc_title": "string",
  "language": "xx",
  "items": [
    {
      "type": "flashcard|mcq|free|case",
      "question": "string",
      "answer": "string (For MCQ, this is the correct answer text)",
      "distractors": ["string"],
      "explanation": "string",
      "tags": ["string"],
      "difficulty": "integer",
      "source_spans": [{"start": 0, "end": 0}]
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
        source_spans: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    start: { type: Type.INTEGER },
                    end: { type: Type.INTEGER }
                },
                required: ['start', 'end']
            }
        }
    },
    required: ['type', 'question', 'answer']
};

const generatedSetSchema = {
    type: Type.OBJECT,
    properties: {
        doc_title: { type: Type.STRING },
        language: { type: Type.STRING },
        items: {
            type: Type.ARRAY,
            items: itemSchema
        }
    },
    required: ['doc_title', 'language', 'items']
};

export interface GenerateParams {
  text: string;
  docTitle: string;
  language?: string;
  goals?: string[];
  maxItems?: number;
  mix?: string;
}

/**
 * Crée une chaîne de caractères de prompt structurée pour l'API Gemini afin de générer un set d'étude.
 *
 * @param {GenerateParams} params Les paramètres pour la génération.
 * @returns {string} Le prompt formaté à envoyer à l'IA.
 */
export const buildGenerationPrompt = (params: GenerateParams): string => {
    const {
        text,
        docTitle,
        language = 'en',
        goals = [],
        maxItems = 10,
        mix = 'a variety of flashcard, mcq, case, and free response items'
    } = params;

    const schemaString = `{\n       "doc_title": "string",\n       "language": "xx",\n       "items": [\n         {\n           "type": "flashcard|mcq|free|case",\n           "question": "string",\n           "answer": "string",\n           "distractors": ["string"],\n           "explanation": "string",\n           "tags": ["string"],\n           "difficulty": 1,\n           "source_spans": [{"start": 0, "end": 0}]\n         }\n       ]\n     }`;

    return `Transform the source text below into a high-quality study set.

**Instructions:**
1. Item Mix: Generate ${mix}.
2. Difficulty: Assign a difficulty score from 1 (easy) to 5 (hard) for each item.
3. MCQ Quality: For multiple-choice questions, ensure the incorrect options (distractors) are plausible and target common misunderstandings.
4. Output Format: Your entire output must be a single, valid JSON object, strictly adhering to the following schema. Do not add any text before or after the JSON object.
Schema: ${schemaString}

**Context:**
- Document Title: "${docTitle}"
- Language: ${language} (Your entire JSON output, including all text fields, must be in this language)
- Primary Learning Goals: ${goals.join(', ') || 'Identify and explain key concepts.'} (Ensure the generated items cover these goals)
- Maximum Number of Items: ${maxItems}

--- SOURCE TEXT ---
${text}
--- END SOURCE TEXT ---

Now, generate the complete, valid JSON output.`;
};


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
