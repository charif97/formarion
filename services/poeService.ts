import { 
  KnowledgeGraph, 
  MasteryLayer, 
  UserContext, 
  PedagogicalDirective
} from "../types";

/**
 * POE (Pedagogical Orchestration Engine)
 * Fonction PURE : f(Graph, Mastery, Context, Time) -> Directive
 * Détermine la stratégie de la session de manière 100% déterministe basée sur des seuils stricts.
 */
export function computeDirective(
  graph: KnowledgeGraph,
  mastery: MasteryLayer,
  context: UserContext,
  timeAvailableMin: number
): PedagogicalDirective {
  
  // 1. Calcul déterministe du volume d'items basé sur le temps
  let maxItems = 3;
  if (timeAvailableMin >= 45) maxItems = 20;
  else if (timeAvailableMin >= 20) maxItems = 10;
  else if (timeAvailableMin >= 10) maxItems = 5;
  else maxItems = 3;

  // 2. Indexation de la maîtrise pour accès rapide (O(1))
  const masteryMap = new Map<string, MasteryLayer[number]>(
    mastery.map(m => [m.nodeId, m])
  );

  // 3. Analyse de l'état de maîtrise par segments (Seuils)
  const criticalStabilityNodes = mastery
    .filter(m => m.stability_index < 40)
    .sort((a, b) => a.stability_index - b.stability_index);

  const remediationNodes = mastery
    .filter(m => m.confidence_score < 40)
    .sort((a, b) => a.confidence_score - b.confidence_score);

  const highMasteryNodes = mastery.filter(m => m.confidence_score >= 90);

  // 4. Logique de décision déterministe (Machine à états)
  let mode: PedagogicalDirective['mode'] = 'Review';
  let intensity = 3;
  let rationale = "";

  // Priorité 1 : État de fatigue ou besoin de récupération (Input: energyLevel 'low' ou sessionType Recovery)
  if (context.signals?.energyLevel === 'low' || context.sessionType === 'Recovery') {
    mode = 'Review';
    intensity = 1;
    rationale = "Énergie basse détectée : focus sur le rappel passif pour maintenir la stabilité sans surcharge cognitive.";
  } 
  // Priorité 2 : Temps très court (Input: timeAvailable <= 10)
  else if (timeAvailableMin <= 10) {
    mode = 'Review';
    intensity = 2;
    rationale = "Session flash : priorité aux ancrages mémoriels rapides pour une rétention efficace en temps limité.";
  }
  // Priorité 3 : Lacunes critiques (Input: confidence_score < 40)
  else if (remediationNodes.length > 0) {
    mode = 'Remediation';
    intensity = 3;
    rationale = "Des concepts fondamentaux ne sont pas acquis (score < 40) : focus sur la remédiation et le scaffolding.";
  }
  // Priorité 4 : Travail Profond - Socratique vs Expansion (Seuils : Focus >= 80% ET session DeepWork)
  else if (context.sessionType === 'DeepWork' && context.focusScore >= 80) {
    // SEUIL SOCRATIQUE : Focus optimal ET au moins 3 piliers de savoir maîtrisés (score >= 90)
    if (highMasteryNodes.length >= 3) {
      mode = 'Socratic';
      intensity = 5;
      rationale = "Conditions de focus et socle de connaissances optimaux : stimulation socratique pour valider la synthèse complexe.";
    } else {
      mode = 'Expansion';
      intensity = 4;
      rationale = "Haute disponibilité cognitive : focus sur l'acquisition de nouveaux nœuds de savoir adjacents.";
    }
  }
  // Priorité 5 : Maintenance de la rétention (Input: stability_index < 40)
  else if (criticalStabilityNodes.length > 0) {
    mode = 'Review';
    intensity = 3;
    rationale = "Risque d'érosion mémorielle détecté (stabilité basse) : session de stabilisation via SRS.";
  }
  // Fallback par défaut : Expansion progressive
  else {
    mode = 'Expansion';
    intensity = 3;
    rationale = "Progression linéaire standard dans le graphe de savoir.";
  }

  // 5. Sélection déterministe des nœuds cibles
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
      rationale = "Expansion bloquée (prérequis non validés) : repli sur la révision des acquis.";
    }
  }
  else if (mode === 'Socratic') {
    targetNodeIds = highMasteryNodes.slice(0, 1).map(m => m.nodeId);
  }

  // Sécurité finale : Toujours renvoyer au moins un nœud
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