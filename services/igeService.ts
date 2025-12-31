import { GoogleGenAI, Type } from "@google/genai";
import { 
  KnowledgeGraph, 
  PedagogicalDirective, 
  StudyItem, 
  GeneratedStudyItem,
  KnowledgeNode
} from "../types";

/**
 * PROMPT ASSET : IGE-V1-STRICT-GENERATOR
 * Mission : Transformer des atomes de savoir en items d'étude sans ajouter d'information externe.
 */
const IGE_SYSTEM_PROMPT = `
Tu es l'IGE (Item Generation Engine). Ta mission est de générer des questions d'étude précises.

RÈGLES D'OR : 
1. EXCLUSIVITÉ : Tu ne dois utiliser EXCLUSIVEMENT que les "Atomes de Savoir" fournis dans le contexte. 
2. PAS D'HALLUCINATION : Interdiction formelle de faire appel à tes connaissances générales ou d'inventer des faits non présents dans les atomes.
3. INSUFFISANCE : Si l'information nécessaire pour répondre au mode demandé est absente des atomes, renvoie exactement la chaîne : "INSUFFICIENT_ATOMS".

MODES PÉDAGOGIQUES :
- Review : Questions factuelles directes (Flashcard, MCQ, True/False) sur les atomes.
- Expansion : Questions liant un atome du nœud cible à un concept de ses prérequis.
- Remediation : Questions simplifiées pour valider les bases atomiques.
- Socratic : Questions ouvertes courtes (type 'free') demandant une synthèse à partir des atomes.

FORMAT DE SORTIE :
Un tableau JSON d'objets respectant le schéma StudyItem, avec métadonnées IGE (sourceNodeId, sourceAtoms, atomCoverage).
`;

const igeSchema = {
  type: Type.ARRAY,
  items: {
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
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      sourceNodeId: { type: Type.STRING },
      sourceAtoms: { type: Type.ARRAY, items: { type: Type.STRING } },
      atomCoverage: { type: Type.NUMBER }
    },
    required: ['type', 'question', 'difficulty', 'sourceNodeId', 'sourceAtoms', 'atomCoverage']
  }
};

/**
 * IGE (Item Generation Engine)
 * Génère des items d'étude à partir d'une directive et du graphe de connaissances.
 */
export async function generateStudyItems(
  graph: KnowledgeGraph,
  directive: PedagogicalDirective
): Promise<StudyItem[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Filtrage des nœuds ciblés et extraction des atomes
  const targetNodes = graph.nodes.filter(n => directive.targetNodeIds.includes(n.id));
  
  if (targetNodes.length === 0) return fallbackGeneration(graph.nodes.slice(0, 1));

  let sourceContext = "### CONTEXTE DES ATOMES DE SAVOIR (SOURCES UNIQUES)\n";
  targetNodes.forEach(node => {
    sourceContext += `\nNOEUD: ${node.label} (ID: ${node.id})\n`;
    sourceContext += `DESCRIPTION: ${node.description}\n`;
    sourceContext += `ATOMES: ${node.content_atoms.join(" | ")}\n`;
    
    if (directive.mode === 'Expansion') {
      const prereqs = graph.nodes.filter(pn => node.prerequisites.includes(pn.id));
      prereqs.forEach(pn => {
        sourceContext += `  - PRÉREQUIS: ${pn.label} (ID: ${pn.id}) -> ATOMES: ${pn.content_atoms.join(" | ")}\n`;
      });
    }
  });

  const prompt = `
    CONTRAT : Génère ${directive.maxItems} items en mode "${directive.mode}" avec une intensité de ${directive.intensity}/5.
    Si tu ne peux pas générer d'item de qualité avec les atomes fournis, réponds "INSUFFICIENT_ATOMS".
    
    CONTEXTE :
    ${sourceContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: IGE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: igeSchema,
      },
    });

    const textResponse = response.text.trim();

    // Gestion du flag d'insuffisance
    if (textResponse.includes("INSUFFICIENT_ATOMS")) {
      return fallbackGeneration(targetNodes);
    }

    const generatedItems: GeneratedStudyItem[] = JSON.parse(textResponse);

    // Initialisation IDs et états SRS
    return generatedItems.map((item, idx) => ({
      ...item,
      id: `ige-${Date.now()}-${idx}`,
      sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
      lastReviewedAt: null,
      nextReviewAt: null
    }));

  } catch (error) {
    console.error("IGE Error:", error);
    return fallbackGeneration(targetNodes);
  }
}

/**
 * Fallback local déterministe si le LLM échoue ou si les atomes sont insuffisants.
 */
function fallbackGeneration(nodes: KnowledgeNode[]): StudyItem[] {
  const items: StudyItem[] = [];
  
  nodes.forEach(node => {
    // Création d'une flashcard basique par atome disponible pour garantir la continuité du service
    node.content_atoms.slice(0, 2).forEach((atom, i) => {
      items.push({
        id: `ige-fallback-${node.id}-${i}-${Date.now()}`,
        type: 'flashcard',
        question: `Concept : ${node.label}. Rappel de l'atome : ${atom}`,
        answer: "Information extraite du document source.",
        explanation: `Source : ${node.description}`,
        difficulty: node.difficulty_weight,
        sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
        lastReviewedAt: null,
        nextReviewAt: null,
        tags: ['Rappel', node.label]
      });
    });
  });

  return items;
}
