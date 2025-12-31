import { GoogleGenAI, Type } from "@google/genai";

const feedbackSystemPrompt = `
You are an expert, encouraging, and precise educational assessor. Your mission is to provide detailed, structured feedback on a student's answer by comparing it to a model answer and a set of key conceptual points.

**CRITICAL RULES:**
1.  **JSON ONLY:** You MUST output ONLY a single, valid JSON object that strictly conforms to the provided schema.
2.  **Analyze Key Points:** Determine which "key_points" are covered, missed, or incorrectly stated in the user's answer.
3.  **Calculate Score:** Provide a score from 0 to 100 based on the percentage of key points covered, minus deductions for inaccuracies.
4.  **Generate Follow-up:** Create a targeted "follow_up" item (e.g., a 'flashcard') to reinforce a concept the student struggled with.
5.  **Provide Advice:** Write a short, personalized \`advice\` string summarizing performance and suggesting improvements.

**OUTPUT JSON SCHEMA:**
{
  "score": "integer (0-100)",
  "covered_points": ["string"],
  "missed_points": ["string"],
  "incorrect_points": ["string"],
  "follow_up": [
    {
      "type": "flashcard",
      "question": "string",
      "answer": "string"
    }
  ],
  "advice": "string"
}
`;

const feedbackResponseSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER },
        covered_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        missed_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        incorrect_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        follow_up: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['flashcard'] },
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                },
                required: ['type', 'question', 'answer']
            }
        },
        advice: { type: Type.STRING }
    },
    required: ['score', 'covered_points', 'missed_points', 'incorrect_points', 'follow_up', 'advice']
};

interface FeedbackParams {
  question: string;
  modelAnswer: string;
  userAnswer: string;
  keyPoints: string[];
}

const buildFeedbackPrompt = ({ question, modelAnswer, userAnswer, keyPoints }: FeedbackParams): string => {
    return `
    Please evaluate the following submission based on your system instructions.

    **Question:** "${question}"
    **Model Answer (for reference):** "${modelAnswer}"
    **Key Points to Look For:**
    ${keyPoints.map(p => `- ${p}`).join('\n')}

    ---
    **User's Answer to Evaluate:**
    "${userAnswer}"
    ---

    Now, generate the complete, valid JSON evaluation.
    `;
};

export const getFeedbackOnAnswer = async (ai: GoogleGenAI, params: FeedbackParams): Promise<any> => {
    const userPrompt = buildFeedbackPrompt(params);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction: feedbackSystemPrompt,
            responseMimeType: "application/json",
            responseSchema: feedbackResponseSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
