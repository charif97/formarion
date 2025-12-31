import { GoogleGenAI, Type } from "@google/genai";
import { 
  KnowledgeGraph, 
  PedagogicalDirective, 
  StudyItem, 
  KnowledgeNode
} from "../types";

/**
 * IGE (Item Generation Engine) - Version Déterministe
 * Mission : Transformer les atomes de savoir en items d'étude sans aucune hallucination.
 */

const IGE_SYSTEM_PROMPT = `
Tu es l'IGE (Item Generation Engine). Ta mission est de générer des questions d'étude basées EXCLUSIVEMENT sur les "Atomes de Savoir" fournis.

RÈGLES DE CONFORMITÉ :
1. ZÉRO HALLUCINATION : Tu ne dois utiliser aucune connaissance externe. Chaque fait dans l'item doit être présent dans les atomes fournis.
2. STATUT DE GÉNÉRATION : 
   - Si les atomes sont suffisants pour le mode demandé : renvoie status "OK".
   - Si les atomes sont insuffisants ou manquants : renvoie status "INSUFFICIENT_ATOMS" et une liste d'items vide [].
3. STRUCTURE DES ITEMS :
   - 'flashcard' : Requiert question + answer (reformulation stricte des atomes).
   - 'mcq' : Requiert question + options + correctAnswerIndex.
   - 'true/false' : Requiert question + correctAnswer.
   - 'free' / 'case' : Requiert question + answer.
4. DÉTERMINISME TECHNIQUE :
   - id : Utilise temporairement le sourceNodeId (sera surchargé par le service).
   - sm2 : Toujours { "interval": 0, "repetitions": 0, "efactor": 2.5 }.
   - lastReviewedAt / nextReviewAt : Toujours null.
`;

const igeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { 
      type: Type.STRING, 
      description: "Doit être 'OK' ou 'INSUFFICIENT_ATOMS'." 
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "Un de: 'flashcard', 'mcq', 'free', 'case', 'true/false'" },
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswerIndex: { type: Type.INTEGER },
          correctAnswer: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING },
          difficulty: { type: Type.INTEGER },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          sourceNodeId: { type: Type.STRING },
          sourceAtoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          atomCoverage: { type: Type.NUMBER },
          sm2: {
            type: Type.OBJECT,
            properties: {
              interval: { type: Type.INTEGER },
              repetitions: { type: Type.INTEGER },
              efactor: { type: Type.NUMBER }
            },
            required: ['interval', 'repetitions', 'efactor']
          },
          lastReviewedAt: { type: Type.STRING, nullable: true },
          nextReviewAt: { type: Type.STRING, nullable: true }
        },
        required: [
          'type', 'question', 'difficulty', 'sourceNodeId', 'sourceAtoms', 
          'atomCoverage', 'sm2', 'lastReviewedAt', 'nextReviewAt'
        ]
      }
    }
  },
  required: ['status', 'items']
};

/**
 * Génère des items d'étude de manière déterministe.
 */
export async function generateStudyItems(
  graph: KnowledgeGraph,
  directive: PedagogicalDirective
): Promise<StudyItem[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const targetNodes = graph.nodes.filter(n => directive.targetNodeIds.includes(n.id));
  if (targetNodes.length === 0) return fallbackGeneration(graph.id, [graph.nodes[0]]);

  let sourceContext = "### SOURCE DES ATOMES\n";
  targetNodes.forEach(node => {
    sourceContext += `\nNOEUD: ${node.label} (ID: ${node.id})\nATOMES: ${node.content_atoms.join(" | ")}\n`;
    if (directive.mode === 'Expansion') {
      const prereqs = graph.nodes.filter(pn => node.prerequisites.includes(pn.id));
      prereqs.forEach(pn => {
        sourceContext += `PRÉREQUIS ID: ${pn.id} ATOMES: ${pn.content_atoms.join(" | ")}\n`;
      });
    }
  });

  const prompt = `Génère ${directive.maxItems} items en mode "${directive.mode}". Intensité: ${directive.intensity}. 
  Contexte source:
  ${sourceContext}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: IGE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: igeResponseSchema,
      },
    });

    const data = JSON.parse(response.text);

    if (data.status === 'INSUFFICIENT_ATOMS' || !data.items || data.items.length === 0) {
      return fallbackGeneration(graph.id, targetNodes);
    }

    // Normalisation et Déterminisme des IDs
    return data.items.map((item: any, idx: number) => ({
      ...item,
      id: `ige-${graph.id}-${item.sourceNodeId || 'unknown'}-${idx}`,
      sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
      lastReviewedAt: null,
      nextReviewAt: null
    }));

  } catch (error) {
    console.error("IGE Error:", error);
    return fallbackGeneration(graph.id, targetNodes);
  }
}

/**
 * Fallback déterministe garantissant zéro hallucination.
 * Utilise les atomes exacts comme réponses pour des flashcards.
 */
function fallbackGeneration(graphId: string, nodes: KnowledgeNode[]): StudyItem[] {
  const items: StudyItem[] = [];
  
  nodes.forEach(node => {
    node.content_atoms.slice(0, 2).forEach((atom, idx) => {
      items.push({
        id: `ige-${graphId}-${node.id}-fallback-${idx}`,
        type: 'flashcard',
        question: `Rappel concernant "${node.label}" : comment est défini ce concept ?`,
        answer: atom, // "answer doit être EXACTEMENT l'atome"
        explanation: `Source : ${node.label}`,
        difficulty: node.difficulty_weight,
        sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
        lastReviewedAt: null,
        nextReviewAt: null,
        tags: ['Fallback', node.label]
      });
    });
  });

  return items;
}
