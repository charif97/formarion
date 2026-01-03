import { MasteryLayer, ActivityEvent } from '../types';

export type WeakNodeInsight = {
  nodeId: string;
  label: string;
  confidence: number;
  stability: number;
  errors7d: number;
  priority: number;
  reason: string;
};

/**
 * Calcule les nœuds de savoir nécessitant une attention immédiate (nœuds faibles).
 * Critères :
 * - Score de confiance bas (< 60) ET Stabilité faible (< 40)
 * - OU Au moins 2 erreurs récentes (quality <= 2) sur les 7 derniers jours.
 */
export function computeWeakNodes(
  mastery: MasteryLayer,
  activity: ActivityEvent[],
  nodeLabels: Record<string, string> = {},
  now: Date = new Date(),
  limit: number = 5
): WeakNodeInsight[] {
  const sevenDaysAgo = now.getTime() - 7 * 24 * 3600 * 1000;

  // 1. Calculer les erreurs par nœud sur 7 jours
  const errorsPerNode: Record<string, number> = {};
  activity.forEach((event) => {
    if (
      event.nodeId &&
      event.quality !== undefined &&
      event.quality <= 2 &&
      new Date(event.ts).getTime() > sevenDaysAgo
    ) {
      errorsPerNode[event.nodeId] = (errorsPerNode[event.nodeId] || 0) + 1;
    }
  });

  // 2. Analyser chaque état de maîtrise
  const weakNodes: WeakNodeInsight[] = [];

  mastery.forEach((state) => {
    const errors7d = errorsPerNode[state.nodeId] || 0;
    const isStatisticallyWeak = state.confidence_score < 60 && state.stability_index < 40;
    const isProneToError = errors7d >= 2;

    if (isStatisticallyWeak || isProneToError) {
      // Calcul de la priorité (déterministe)
      // On combine l'écart aux objectifs (60/40) et un malus pour les erreurs répétées
      const basePriority = Math.max(0, 60 - state.confidence_score) + Math.max(0, 40 - state.stability_index);
      const errorPenalty = errors7d * 15;
      const priority = basePriority + errorPenalty;

      // Construction du motif (Reason)
      let reason = "";
      if (errors7d >= 2) reason = `${errors7d} erreurs récentes`;
      else if (state.confidence_score < 40) reason = "Maîtrise critique";
      else reason = "Faible rétention";

      weakNodes.push({
        nodeId: state.nodeId,
        label: nodeLabels[state.nodeId] || state.nodeId,
        confidence: state.confidence_score,
        stability: state.stability_index,
        errors7d,
        priority,
        reason
      });
    }
  });

  // 3. Trier par priorité décroissante et limiter
  return weakNodes
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}