import { 
  KnowledgeGraph, 
  MasteryLayer, 
  UserContext, 
  PedagogicalDirective
} from "../types";

/**
 * POE (Pedagogical Orchestration Engine)
 * Fonction PURE : f(Graph, Mastery, Context, Time) -> Directive
 * Détermine la stratégie de la session de manière 100% déterministe.
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
  const masteryMap = new Map<string, MasteryLayer[number]>(
    mastery.map(m => [m.nodeId, m])
  );

  // 3. Analyse de l'état de maîtrise par segments
  const criticalStabilityNodes = mastery
    .filter(m => m.stability_index < 40)
    .sort((a, b) => a.stability_index - b.stability_index);

  const remediationNodes = mastery
    .filter(m => m.confidence_score < 40)
    .sort((a, b) => a.confidence_score - b.confidence_score);

  const highMasteryNodes = mastery.filter(m => m.confidence_score >= 90);

  // 4. Détermination du MODE et de l'INTENSITÉ (Logique Déterministe)
  let mode: PedagogicalDirective['mode'] = 'Review';
  let intensity = 3;
  let rationale = "";

  // Priorité 1 : Récupération ou Sprint Court (basé sur le type de session)
  if (context.sessionType === 'Sprint' || context.sessionType === 'Recovery') {
    mode = 'Review';
    intensity = context.sessionType === 'Recovery' ? 1 : 2;
    rationale = `Session de type ${context.sessionType} : priorité au rappel des acquis existants.`;
  } 
  // Priorité 2 : Lacunes critiques (Remédiation basée sur confidence_score < 40)
  else if (remediationNodes.length > 0) {
    mode = 'Remediation';
    intensity = 3;
    rationale = "Des lacunes importantes (score < 40) ont été détectées : focus sur la remédiation.";
  }
  // Priorité 3 : Travail Profond (Socratique vs Expansion basé sur focusScore et highMasteryNodes)
  else if (context.sessionType === 'DeepWork' && context.focusScore >= 80) {
    // Remplacement de la condition non-déterministe par une règle stricte sur les inputs
    if (highMasteryNodes.length >= 3) {
      mode = 'Socratic';
      intensity = 5;
      rationale = "Focus et socle de connaissances élevés : mode socratique activé pour tester la synthèse.";
    } else {
      mode = 'Expansion';
      intensity = 4;
      rationale = "Conditions de focus optimales pour l'acquisition de nouveaux concepts.";
    }
  }
  // Priorité 4 : Maintenance de la stabilité (basée sur stability_index < 40)
  else if (criticalStabilityNodes.length > 0) {
    mode = 'Review';
    intensity = 3;
    rationale = "Risque d'oubli détecté (stabilité < 40) : session de maintenance préventive.";
  }
  // Fallback : Expansion standard
  else {
    mode = 'Expansion';
    intensity = 3;
    rationale = "Progression standard dans le graphe de savoir.";
  }

  // 5. Sélection déterministe des targetNodeIds
  let targetNodeIds: string[] = [];

  if (mode === 'Review') {
    targetNodeIds = criticalStabilityNodes.length > 0 
      ? criticalStabilityNodes.slice(0, 3).map(n => n.nodeId)
      : mastery.slice(0, 3).map(n => n.nodeId);
  } 
  else if (mode === 'Remediation') {
    targetNodeIds = remediationNodes.slice(0, 2).map(n => n.nodeId);
  }
  else if (mode === 'Expansion') {
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
    
    if (targetNodeIds.length === 0) {
      mode = 'Review';
      targetNodeIds = mastery.slice(0, 3).map(n => n.nodeId);
      rationale = "Expansion impossible (prérequis non validés) : repli sur la révision.";
    }
  }
  else if (mode === 'Socratic') {
    targetNodeIds = highMasteryNodes.slice(0, 1).map(m => m.nodeId);
  }

  // Sécurité finale : toujours retourner au moins un noeud
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