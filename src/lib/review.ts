import { StudyItem } from '../types';

/**
 * Construit une file d'attente pour la révision quotidienne.
 * 
 * Logique :
 * 1. Sélectionne les items dont la date de révision est dépassée (SRS Due).
 * 2. Trie par date de révision la plus ancienne (priorité au retard).
 * 3. Si la file n'est pas pleine, ajoute des items jamais vus (nouveaux).
 * 4. Si toujours pas pleine, ajoute les items avec la plus faible stabilité (renforcement).
 * 
 * @param items Liste globale des items stockés pour le graphe actif.
 * @param now Date de référence (généralement maintenant).
 * @param limit Nombre maximum d'items pour la session.
 */
export function buildDailyReviewQueue(
  items: StudyItem[],
  now: Date = new Date(),
  limit: number = 10
): StudyItem[] {
  if (items.length === 0) return [];

  const nowTime = now.getTime();

  // 1. Items "Dues" (prêts pour révision)
  const dueItems = items.filter(item => 
    item.nextReviewAt && new Date(item.nextReviewAt).getTime() <= nowTime
  ).sort((a, b) => {
    // Plus ancien nextReviewAt d'abord
    const timeA = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
    const timeB = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
    return timeA - timeB;
  });

  let queue = [...dueItems.slice(0, limit)];

  // 2. Fallback 1 : Items jamais vus (New items)
  if (queue.length < limit) {
    const newItems = items.filter(item => 
      !item.lastReviewedAt && !queue.find(q => q.id === item.id)
    ).slice(0, limit - queue.length);
    
    queue = [...queue, ...newItems];
  }

  // 3. Fallback 2 : Items avec la plus faible stabilité/intervalle court (Renforcement)
  if (queue.length < limit) {
    const reinforcementCandidates = items.filter(item => 
      !queue.find(q => q.id === item.id)
    ).sort((a, b) => (a.sm2.interval || 0) - (b.sm2.interval || 0))
    .slice(0, limit - queue.length);

    queue = [...queue, ...reinforcementCandidates];
  }

  return queue;
}
