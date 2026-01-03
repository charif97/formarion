import type { Sm2State, StudyItem } from '../types';

/**
 * Implémente l'algorithme de répétition espacée SM-2 avec durcissement des données.
 * Garantit une sortie stable même avec des entrées corrompues ou hors limites.
 */
export const calculateSm2 = (
  item: Sm2State,
  quality: number,
  now: Date = new Date()
): Sm2State & { nextReviewAt: Date } => {
  // 1. Durcissement de la note (quality) : clamp entre 0 et 5
  const q = Math.max(0, Math.min(5, Math.round(Number(quality) || 0)));

  // 2. Durcissement des données d'entrée (localStorage recovery)
  let interval = (item && typeof item.interval === 'number' && item.interval >= 0) ? item.interval : 0;
  let repetitions = (item && typeof item.repetitions === 'number' && item.repetitions >= 0) ? item.repetitions : 0;
  let efactor = (item && typeof item.efactor === 'number' && item.efactor >= 1.3) ? item.efactor : 2.5;

  // 3. Logique SM-2
  if (q < 3) {
    // Réinitialisation en cas d'échec
    repetitions = 0;
    interval = 1;
  } else {
    // Mise à jour du facteur de facilité
    efactor = efactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (efactor < 1.3) {
      efactor = 1.3;
    }

    repetitions += 1;

    // Calcul de l'intervalle
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * efactor));
    }
  }
  
  // 4. Calcul de la date de révision sécurisé
  const referenceDate = (now instanceof Date && !isNaN(now.getTime())) ? now : new Date();
  const nextReviewAt = new Date(referenceDate);
  nextReviewAt.setDate(referenceDate.getDate() + interval);

  return { interval, repetitions, efactor, nextReviewAt };
};

/**
 * Filtre les items dus pour révision avec gestion d'erreurs sur les dates stockées.
 */
export const getDueStudyItems = (items: StudyItem[]): StudyItem[] => {
  if (!Array.isArray(items)) return [];
  
  const nowTime = new Date().getTime();
  
  return items.filter(item => {
    // Si pas de date de révision, l'item est considéré comme nouveau/du
    if (!item.nextReviewAt) {
      return true;
    }
    
    // Tentative de parsing de la date stockée
    const reviewDate = new Date(item.nextReviewAt);
    
    // Si la date est invalide (string corrompue), on considère l'item comme du (sécurité)
    if (isNaN(reviewDate.getTime())) {
      return true;
    }
    
    return reviewDate.getTime() <= nowTime;
  });
};