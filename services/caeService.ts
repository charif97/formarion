import { GoogleGenAI, Type } from "@google/genai";
import { UserSignals, UserContext } from "../types";

/**
 * CaeInsight est un alias pour UserContext utilisé dans la gestion d'état.
 */
export type CaeInsight = UserContext;

/**
 * PROMPT ASSET VERSION : CAE-V3-PURE-DESCRIPTION
 * Mission : Qualifier l'état de l'apprenant sans prescrire d'action ou de recommandation pédagogique.
 */
const CAE_SYSTEM_PROMPT = `
Tu es le Moteur de Contexte (CAE) du projet. Ta mission unique est d'analyser les signaux d'entrée pour qualifier la disponibilité cognitive de l'apprenant de manière neutre et analytique.

INPUT (UserSignals) :
- Temps (timeAvailable) : minutes disponibles.
- Énergie (energyLevel) : ressenti subjectif de fatigue/vitalité (low, medium, high).
- Stress (stressLevel) : niveau de tension actuel (low, medium, high).

TA MISSION D'ANALYSE :
1. FOCUS SCORE : Calcule une valeur entière de 1 à 100 représentant la bande passante mentale disponible.
2. STATE DESCRIPTION : Rédige une qualification factuelle de l'état actuel (ex: "Charge mentale élevée, temps restreint"). Max 120 caractères.
3. SESSION TYPOLOGY : Catégorise l'état parmi l'un des quatre types : Sprint (peu de temps), DeepWork (haute énergie/temps), Maintenance (énergie moyenne), Recovery (basse énergie/haut stress).

RÈGLES CRITIQUES :
- AUCUNE PRESCRIPTION : Interdiction formelle de suggérer des méthodes d'étude, des contenus spécifiques ou des actions ("tu devrais faire ceci...").
- AUCUN CONSEIL : Ta sortie doit être purement descriptive de l'état présent.
- FORMAT : Sortie JSON stricte selon le schéma.
`;

const caeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    stateDescription: {
      type: Type.STRING,
      description: "Description neutre et factuelle de l'état de l'utilisateur."
    },
    focusScore: {
      type: Type.INTEGER,
      description: "Indice de disponibilité cognitive entre 1 et 100."
    },
    sessionType: {
      type: Type.STRING,
      enum: ['Sprint', 'DeepWork', 'Maintenance', 'Recovery'],
      description: "Typologie de session déduite des signaux."
    }
  },
  required: ['stateDescription', 'focusScore', 'sessionType']
};

/**
 * Analyse les signaux utilisateur via Gemini pour produire un contexte normalisé descriptif.
 * @param input Signaux bruts saisis par l'utilisateur.
 * @returns UserContext Contexte normalisé (descriptif uniquement).
 */
export const calibrateSession = async (input: UserSignals): Promise<UserContext> => {
  // Initialisation de l'API avec la clé d'environnement
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Signaux d'entrée à qualifier :
  - Temps disponible : ${input.timeAvailable} minutes
  - Énergie cognitive : ${input.energyLevel}
  - Niveau de stress : ${input.stressLevel}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: CAE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: caeResponseSchema,
    },
  });

  // Extraction du JSON depuis la réponse texte (propriété .text)
  const analysis = JSON.parse(response.text);

  return {
    focusScore: analysis.focusScore,
    sessionType: analysis.sessionType,
    stateDescription: analysis.stateDescription,
    signals: input
  };
};