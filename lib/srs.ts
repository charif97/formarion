
import type { Sm2State, StudyItem } from '../types';

/**
 * Implémente l'algorithme de répétition espacée SM-2 pour calculer le prochain état d'une carte d'étude.
 *
 * @param {Sm2State} item L'état actuel de la carte, contenant { interval, repetitions, efactor }.
 * @param {number} quality La note de l'utilisateur sur sa capacité à se souvenir de la carte (0-5).
 *   - 5: Réponse parfaite
 *   - 4: Réponse correcte après une hésitation
 *   - 3: Réponse correcte avec une difficulté importante
 *   - 2: Réponse incorrecte, mais la bonne réponse semblait facile à se rappeler
 *   - 1: Réponse incorrecte, mais la bonne réponse a été rappelée
 *   - 0: Oubli total.
 * @param {Date} [now=new Date()] La date actuelle, utilisée pour calculer la prochaine date de révision.
 *
 * @returns {Sm2State & { nextReviewAt: Date }} Un objet contenant le nouvel état de la carte
 *   (`interval`, `repetitions`, `efactor`) et la prochaine date de révision (`nextReviewAt`).
 */
export const calculateSm2 = (
  item: Sm2State,
  quality: number,
  now: Date = new Date()
): Sm2State & { nextReviewAt: Date } => {
  if (quality < 0 || quality > 5) {
    throw new Error("La note (quality) doit être comprise entre 0 et 5.");
  }

  let { interval, repetitions, efactor } = item;

  // Si la réponse est incorrecte (note < 3)
  if (quality < 3) {
    // On réinitialise le nombre de répétitions et l'intervalle est fixé à 1 jour.
    repetitions = 0;
    interval = 1;
  } else {
    // Si la réponse est correcte, on met à jour le facteur de facilité (efactor)
    // et on calcule le prochain intervalle.
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) {
      efactor = 1.3; // Le facteur de facilité ne doit pas être inférieur à 1.3
    }

    repetitions += 1;

    // Calcul du nouvel intervalle basé sur le nombre de répétitions
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * efactor);
    }
  }
  
  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(now.getDate() + interval);

  return { interval, repetitions, efactor, nextReviewAt };
};

/**
 * Filtre une liste de cartes d'étude pour ne retourner que celles qui sont dues pour une révision.
 * Une carte est considérée comme "due" si sa date et heure de prochaine révision sont atteintes.
 *
 * @param {StudyItem[]} items Un tableau d'objets StudyItem.
 * @returns {StudyItem[]} Un nouveau tableau contenant uniquement les cartes dues.
 */
export const getDueStudyItems = (items: StudyItem[]): StudyItem[] => {
    const now = new Date();
    return items.filter(item => {
        if (!item.nextReviewAt) {
            // Les cartes jamais révisées sont toujours dues.
            return true;
        }
        return new Date(item.nextReviewAt) <= now;
    });
};
