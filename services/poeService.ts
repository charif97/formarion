import { 
  KnowledgeGraph, 
  MasteryLayer, 
  UserContext, 
  PedagogicalDirective,
  MasteryState
} from "../types";

/**
 * POE (Pedagogical Orchestration Engine)
 * Fonction PURE : f(Graph, Mastery, Context, Time) -> Directive
 * Détermine la stratégie de la session sans appel LLM.
 */
export function computeDirective(
  graph: KnowledgeGraph,
  mastery: MasteryLayer,
  context: UserContext,
  timeAvailableMin: number
): PedagogicalDirective {
  
  // 1. Calcul du volume d'items (maxItems) basé sur le temps
  let maxItems = 3;
  if (timeAvailableMin >= 45) maxItems = 20;
  else if (timeAvailableMin >= 20) maxItems = 10;
  else if (timeAvailableMin >= 10) maxItems = 5;
  else maxItems = 3;

  // 2. Indexation de la maîtrise pour accès rapide
  const masteryMap = new Map<string, MasteryState>(
    mastery.map(m => [m.nodeId, m])
  );

  // 3. Analyse de l'état de maîtrise
  const criticalStabilityNodes = mastery
    .filter(m => m.stability_index < 40)
    .sort((a, b) => a.stability_index - b.stability_index);

  const remediationNodes = mastery
    .filter(m => m.confidence_score < 40)
    .sort((a, b) => a.confidence_score - b.confidence_score);

  // 4. Détermination du MODE et de l'INTENSITÉ
  let mode: PedagogicalDirective['mode'] = 'Review';
  let intensity = 3;
  let rationale = "";

  // Logique de décision déterministe
  if (context.sessionType === 'Sprint' || context.sessionType === 'Recovery') {
    mode = 'Review';
    intensity = context.sessionType === 'Recovery' ? 1 : 2;
    rationale = `Session de type ${context.sessionType} : priorité au rappel des acquis avec un effort modéré.`;
  } 
  else if (remediationNodes.length > 0) {
    mode = 'Remediation';
    intensity = 3;
    rationale = "Des lacunes importantes ont été détectées : focus sur la remédiation des concepts critiques.";
  }
  else if (context.sessionType === 'DeepWork' && context.focusScore >= 80) {
    const highMasteryNodes = mastery.filter(m => m.confidence_score > 90);
    if (highMasteryNodes.length >= 3 && Math.random() > 0.5) {
      mode = 'Socratic';
      intensity = 5;
      rationale = "Focus et maîtrise élevés : mode socratique pour tester la synthèse et l'application complexe.";
    } else {
      mode = 'Expansion';
      intensity = 4;
      rationale = "Conditions de focus optimales pour l'acquisition de nouveaux concepts (Expansion).";
    }
  }
  else if (criticalStabilityNodes.length > 0) {
    mode = 'Review';
    intensity = 3;
    rationale = "Certains acquis présentent un risque d'oubli : session de maintenance de la stabilité.";
  }
  else {
    mode = 'Expansion';
    intensity = 3;
    rationale = "Session standard : poursuite de la progression dans le graphe de savoir.";
  }

  // 5. Sélection des targetNodeIds (1 à 3 nodes max)
  let targetNodeIds: string[] = [];

  if (mode === 'Review') {
    targetNodeIds = criticalStabilityNodes.slice(0, 3).map(n => n.nodeId);
  } 
  else if (mode === 'Remediation') {
    targetNodeIds = remediationNodes.slice(0, 2).map(n => n.nodeId);
  }
  else if (mode === 'Expansion') {
    // Sélectionner des nodes dont les prérequis sont maîtrisés (>70)
    const candidates = graph.nodes.filter(node => {
      const nodeMastery = masteryMap.get(node.id);
      const isNotMastered = !nodeMastery || nodeMastery.confidence_score < 70;
      
      const prereqsOk = node.prerequisites.every(pId => {
        const pMastery = masteryMap.get(pId);
        return pMastery && pMastery.confidence_score >= 70;
      });

      return isNotMastered && prereqsOk;
    });

    targetNodeIds = candidates.slice(0, 2).map(n => n.id);
    
    // Fallback si aucune expansion possible -> Review
    if (targetNodeIds.length === 0) {
      mode = 'Review';
      targetNodeIds = mastery.slice(0, 3).map(n => n.nodeId);
      rationale = "Expansion bloquée par les prérequis : repli sur la révision des bases.";
    }
  }
  else if (mode === 'Socratic') {
    targetNodeIds = mastery
      .filter(m => m.confidence_score > 90)
      .slice(0, 1)
      .map(m => m.nodeId);
  }

  // Sécurité finale : au moins un node si le graphe n'est pas vide
  if (targetNodeIds.length === 0 && graph.nodes.length > 0) {
    targetNodeIds = [graph.nodes[0].id];
  }

  return {
    mode,
    targetNodeIds,
    intensity,
    maxItems,
    rationale
  };
}
