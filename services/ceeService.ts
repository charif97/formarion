import { GoogleGenAI, Type } from "@google/genai";
import { 
  KnowledgeGraph, 
  PedagogicalDirective, 
  StudyItem,
  KnowledgeNode
} from "../types";

/**
 * PROMPT ASSET VERSION : CEE-V1-EXTRACTION-ENGINE
 * Mission : Transformer les atomes de savoir bruts en items d'étude basés sur une directive stratégique.
 */
const CEE_SYSTEM_PROMPT = `
Tu es le Moteur d'Extraction de Contenu (CEE). Ta mission est de générer des exercices pédagogiques (StudyItems) en respectant strictement une directive stratégique et une base de connaissances atomisée.

RÈGLES D'EXTRACTION :
1. SOURCE UNIQUE : Tu ne dois utiliser QUE les "content_atoms" fournis. N'invente aucune information extérieure.
2. ADAPTATION AU MODE :
   - Review : Produis des flashcards ou QCM de rappel direct (mémorisation).
   - Expansion : Produis des questions qui lient le concept cible à ses pré-requis.
   - Remediation : Produis des questions simplifiées, étape par étape, pour lever une confusion.
   - Socratic : Produis des exercices de réflexion profonde ou d'application de scénario.
3. INTENSITÉ : Respecte le niveau d'intensité (1-5). Plus l'intensité est haute, plus les distracteurs (QCM) sont subtils et les questions complexes.
4. LANGUE : Génère le contenu dans la langue utilisée dans les atomes de savoir.
`;

const studyItemSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['flashcard', 'mcq', 'free', 'case', 'true/false'] },
      question: { type: Type.STRING },
      answer: { type: Type.STRING, description: "Réponse correcte ou explication de la réponse." },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Uniquement pour le type 'mcq'." 
      },
      correctAnswerIndex: { type: Type.INTEGER, description: "Uniquement pour le type 'mcq'." },
      explanation: { type: Type.STRING, description: "Pourquoi cette réponse est la bonne (contexte issu des atomes)." },
      difficulty: { type: Type.INTEGER, description: "Niveau de difficulté de l'item (1-5)." },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['type', 'question', 'answer', 'difficulty']
  }
};

/**
 * Génère le contenu de la session d'étude basé sur la stratégie POE.
 */
export const generateSessionContent = async (
  graph: KnowledgeGraph,
  directive: PedagogicalDirective
): Promise<StudyItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Extraction des données sources pertinentes
  const targetNodes = graph.nodes.filter(node => directive.targetNodeIds.includes(node.id));
  const contextData = targetNodes.map(node => ({
    label: node.label,
    atoms: node.content_atoms,
    description: node.description
  }));

  const userPrompt = `
    DIRECTIVE POE :
    - Mode : ${directive.mode}
    - Intensité : ${directive.intensity}/5
    - Nombre max d'items : ${directive.maxItems}
    - Justification stratégique : ${directive.rationale}

    ATOMS DE SAVOIR SOURCES :
    ${JSON.stringify(contextData)}

    Consigne : Génère ${directive.maxItems} items d'étude de type varié adaptés au mode "${directive.mode}".
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: CEE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: studyItemSchema,
    },
  });

  const rawItems = JSON.parse(response.text);

  // 2. Post-processing : Attribution des IDs et initialisation SRS
  return rawItems.map((item: any, idx: number) => ({
    ...item,
    id: `cee-item-${Date.now()}-${idx}`,
    sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
    lastReviewedAt: null,
    nextReviewAt: null
  }));
};

/**
 * EXEMPLE DE SORTIE CEE (Mode Review) :
 * [
 *   {
 *     type: 'mcq',
 *     question: "Quel est l'atome de savoir principal concernant le concept X ?",
 *     options: ["Option A", "Option B", "Option C"],
 *     correctAnswerIndex: 0,
 *     answer: "Option A",
 *     difficulty: 2,
 *     explanation: "Basé sur l'atome de savoir extrait du document source..."
 *   }
 * ]
 */
