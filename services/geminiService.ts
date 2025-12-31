
import { GoogleGenAI, Type } from "@google/genai";
import { KnowledgeGraph, KnowledgeNode, StudyItem, MCQ } from "../types";

// Types used by StudyView and EvaluationView
export interface FollowUpItem {
    type: 'flashcard';
    question: string;
    answer: string;
}

export interface Feedback {
    score: number;
    covered_points: string[];
    missed_points: string[];
    incorrect_points: string[];
    follow_up: FollowUpItem[];
    advice: string;
}

// Fixed: Initializing directly with process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * PROMPT ASSET VERSION : CIE-V1-ONTOLOGY
 * Mission : Transformer un document brut en DAG de connaissances.
 */
const CIE_SYSTEM_PROMPT = `
Tu es le Moteur d'Ingestion de Contenu (CIE). Ta mission est de déconstruire un document technique/pédagogique en un Graphe de Savoir structuré (DAG).

RÈGLES D'ONTOLOGIE :
1. ATOMISATION : Divise le savoir en unités logiques autonomes (Nœuds).
2. DÉPENDANCES : Identifie les pré-requis logiques. Un concept B ne peut être compris sans A.
3. ATOMES DE SAVOIR : Pour chaque nœud, extrais 3 à 5 faits précis et immuables issus du texte.
4. JSON STRICT : Ta sortie doit être un objet JSON unique respectant le schéma fourni.

AUCUNE LINÉARITÉ : Le graphe doit permettre plusieurs chemins d'apprentissage.
POSTURE : Expert en ingénierie pédagogique, précis, froid, analytique.
`;

const nodeSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    label: { type: Type.STRING },
    description: { type: Type.STRING },
    content_atoms: { type: Type.ARRAY, items: { type: Type.STRING } },
    prerequisites: { type: Type.ARRAY, items: { type: Type.STRING }, description: "IDs des noeuds requis" },
    difficulty_weight: { type: Type.INTEGER, description: "1-5" }
  },
  required: ['id', 'label', 'description', 'content_atoms', 'prerequisites', 'difficulty_weight']
};

const graphSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    nodes: { type: Type.ARRAY, items: nodeSchema }
  },
  required: ['title', 'nodes']
};

export const generateKnowledgeGraph = async (text: string, title: string): Promise<KnowledgeGraph> => {
  const prompt = `Génère l'ontologie de savoir pour le document suivant : "${title}".
  
  DOCUMENT SOURCE :
  ---
  ${text}
  ---
  
  Produis le JSON du Graphe de Savoir.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: CIE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: graphSchema,
    },
  });

  // Fixed: response.text is a property
  const parsed = JSON.parse(response.text);
  
  return {
    id: `graph-${Date.now()}`,
    title: parsed.title || title,
    nodes: parsed.nodes,
    source_text: text,
    created_at: new Date().toISOString()
  };
};

/**
 * STUDY SET GENERATION
 */
const studyItemSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['flashcard', 'mcq', 'free', 'case', 'true/false'] },
        question: { type: Type.STRING },
        answer: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswerIndex: { type: Type.INTEGER },
        correctAnswer: { type: Type.BOOLEAN },
        explanation: { type: Type.STRING },
        difficulty: { type: Type.INTEGER },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['type', 'question']
};

const studySetSchema = {
    type: Type.ARRAY,
    items: studyItemSchema
};

export const generateStudySet = async (text: string, title: string): Promise<StudyItem[]> => {
    const prompt = `Génère 10 items d'étude variés (QCM, Flashcards, Vrai/Faux) pour le document "${title}".
    
    TEXTE :
    ${text}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: "Tu es un expert en pédagogie. Génère des questions stimulantes et précises.",
            responseMimeType: "application/json",
            responseSchema: studySetSchema,
        },
    });

    // Fixed: response.text is a property
    const items = JSON.parse(response.text);
    return items.map((item: any, idx: number) => ({
        ...item,
        id: `item-${Date.now()}-${idx}`,
        sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
        lastReviewedAt: null,
        nextReviewAt: null
    }));
};

/**
 * FEEDBACK GENERATION
 */
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

export const getFeedbackOnAnswer = async (params: { 
    question: string, 
    modelAnswer: string, 
    userAnswer: string, 
    keyPoints: string[] 
}): Promise<Feedback> => {
    const prompt = `Évalue la réponse de l'utilisateur.
    Question : ${params.question}
    Réponse attendue : ${params.modelAnswer}
    Points clés : ${params.keyPoints.join(', ')}
    Réponse utilisateur : ${params.userAnswer}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction: "Tu es un tuteur exigeant mais bienveillant. Analyse précisément la réponse.",
            responseMimeType: "application/json",
            responseSchema: feedbackResponseSchema,
        },
    });

    // Fixed: response.text is a property
    return JSON.parse(response.text);
};