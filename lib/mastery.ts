import { MasteryLayer, MasteryState } from '../types';

/**
 * Aligne une MasteryLayer stockée sur la structure actuelle du graphe.
 * Garantit que chaque nœud du graphe possède un état de maîtrise,
 * conserve l'existant, et supprime les reliquats obsolètes.
 */
export function normalizeMasteryLayer(
  nodes: { id: string }[],
  stored: MasteryLayer | null | undefined
): MasteryLayer {
  // Indexation pour une recherche O(1)
  const storedMap = new Map<string, MasteryState>();
  
  if (Array.isArray(stored)) {
    stored.forEach(m => {
      if (m && typeof m.nodeId === 'string') {
        storedMap.set(m.nodeId, m);
      }
    });
  }

  // Construction de la couche normalisée basée sur l'ordre des nœuds du graphe
  return nodes.map(node => {
    const existing = storedMap.get(node.id);
    
    if (existing) {
      // Retourne l'existant en s'assurant de la conformité des types (durcissement)
      return {
        nodeId: node.id,
        confidence_score: typeof existing.confidence_score === 'number' ? existing.confidence_score : 0,
        stability_index: typeof existing.stability_index === 'number' ? existing.stability_index : 0,
        last_interaction_at: (existing.last_interaction_at === null || typeof existing.last_interaction_at === 'string')
          ? existing.last_interaction_at
          : null
      };
    }

    // Initialisation par défaut pour les nouveaux nœuds
    return {
      nodeId: node.id,
      confidence_score: 0,
      stability_index: 0,
      last_interaction_at: null
    };
  });
}
