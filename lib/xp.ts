/**
 * Calcule le seuil d'XP nécessaire pour passer au niveau suivant.
 * Formule MVP : 100 + (level - 1) * 50
 */
export function xpForLevel(level: number): number {
  return 100 + (Math.max(1, level) - 1) * 50;
}

/**
 * Détermine le montant d'XP gagné en fonction de la qualité SRS (0-5).
 */
export function awardXp(quality: number): number {
  switch (quality) {
    case 5: return 20;
    case 4: return 15;
    case 3: return 10;
    case 2: return 5;
    case 1:
    case 0:
    default: return 0;
  }
}

/**
 * Applique le gain d'XP et gère le passage de niveau (level up).
 * Retourne le nouvel état de progression.
 */
export function applyXp(level: number, currentXp: number, gainedXp: number): { level: number; currentXp: number; xpForNextLevel: number } {
  let newXp = currentXp + gainedXp;
  let newLevel = level;

  // Boucle de level-up si l'XP dépasse le seuil actuel
  while (newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel);
    newLevel++;
  }

  return {
    level: newLevel,
    currentXp: newXp,
    xpForNextLevel: xpForLevel(newLevel)
  };
}
