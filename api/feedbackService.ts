import { GoogleGenAI, Type } from "@google/genai";
import type { StudyItem } from '../types'; // Assuming a shared types definition could be useful.

const feedbackSystemPrompt = `
You are an expert, encouraging, and precise educational assessor. Your mission is to provide detailed, structured feedback on a student's answer by comparing it to a model answer and a set of key conceptual points.

**CRITICAL RULES:**
1.  **JSON ONLY:** You MUST output ONLY a single, valid JSON object that strictly conforms to the schema provided below. Do not include any introductory text, explanations, apologies, or markdown formatting like \`\`\`json blocks. Your entire response must be a single, parsable JSON object.
2.  **Analyze Key Points:**
    -   Carefully review the user's answer and determine which of the provided "key_points" are correctly covered. List these in the \`covered_points\` array.
    -   Identify which "key_points" are missing from the user's answer. List these in the \`missed_points\` array.
3.  **Identify Inaccuracies:**
    -   Analyze the user's answer for any statements that are factually incorrect or contradict the model answer. Summarize these inaccuracies in the \`incorrect_points\` array.
4.  **Calculate Score:**
    -   Calculate a score from 0 to 100. The score should primarily be based on the percentage of key points covered. Deduct points for significant inaccuracies.
5.  **Generate Follow-up Content:**
    -   Based on the \`missed_points\` and \`incorrect_points\`, create one or two targeted "follow_up" items (e.g., a 'flashcard'). These should help the student reinforce the specific concepts they struggled with. The questions should be different from the original question.
6.  **Provide Constructive Advice:**
    -   Write a short, personalized \`advice\` string (1-3 sentences) that summarizes the student's performance, praises their strengths, and suggests specific areas for improvement based on the analysis.

**OUTPUT JSON SCHEMA:**
{
  "score": "integer (0-100)",
  "covered_points": ["string - A key point the user correctly answered."],
  "missed_points": ["string - A key point the user did not mention."],
  "incorrect_points": ["string - A summary of a factual error in the user's answer."],
  "follow_up": [
    {
      "type": "flashcard",
      "question": "string - A new question about a missed/incorrect point.",
      "answer": "string - The answer to the follow-up question."
    }
  ],
  "advice": "string - Personalized, constructive feedback."
}
`;

const feedbackResponseSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: "A numerical score from 0 to 100 representing the correctness and completeness of the user's answer."
        },
        covered_points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of key points that the user's answer correctly covered."
        },
        missed_points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of key points that were missing from the user's answer."
        },
        incorrect_points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of statements summarizing any factual inaccuracies in the user's answer."
        },
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
            },
            description: "An array of new study items designed to reinforce concepts the user struggled with."
        },
        advice: {
            type: Type.STRING,
            description: "Concise, personalized, and constructive advice for the user."
        }
    },
    required: ['score', 'covered_points', 'missed_points', 'incorrect_points', 'follow_up', 'advice']
};

interface FeedbackParams {
  question: string;
  modelAnswer: string;
  userAnswer: string;
  keyPoints: string[];
}

export const buildFeedbackPrompt = ({ question, modelAnswer, userAnswer, keyPoints }: FeedbackParams): string => {
    return `
    Please evaluate the following submission based on your system instructions.

    **Question:**
    "${question}"

    **Model Answer (for reference):**
    "${modelAnswer}"

    **Key Points to Look For:**
    ${keyPoints.map(p => `- ${p}`).join('\n')}

    ---
    **User's Answer to Evaluate:**
    "${userAnswer}"
    ---

    Now, generate the complete, valid JSON evaluation.
    `;
};


export const getFeedbackOnAnswer = async (
    ai: GoogleGenAI,
    params: FeedbackParams
): Promise<any> => {

    const userPrompt = buildFeedbackPrompt(params);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Flash is sufficient and faster for this evaluation task
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