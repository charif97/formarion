import { useState, useCallback } from 'react';
import type { Sm2State } from '../types';

/**
 * Configuration for the SM-2 algorithm.
 */
export interface Sm2Config {
  /** The base value added to the efactor. Default: 0.1 */
  efactorBaseIncrement?: number;
  /** A multiplier affecting how much quality impacts the efactor. Default: 0.08 */
  efactorQualityMultiplier?: number;
  /** An exponential factor for quality's impact on efactor. Default: 0.02 */
  efactorQualityExponent?: number;
  /** The minimum value for the efactor. Default: 1.3 */
  minEfactor?: number;
  /** The specific intervals (in days) for the first and second successful repetitions. Default: [1, 6] */
  initialIntervals?: [number, number];
}

const defaultConfig: Required<Sm2Config> = {
    efactorBaseIncrement: 0.1,
    efactorQualityMultiplier: 0.08,
    efactorQualityExponent: 0.02,
    minEfactor: 1.3,
    initialIntervals: [1, 6]
};

/**
 * A hook that encapsulates the SM-2 spaced repetition algorithm logic.
 * @param initialItem The initial state of the item's SRS data.
 * @param config Optional configuration to customize the algorithm's behavior.
 */
const useSm2 = (initialItem: Sm2State, config?: Sm2Config) => {
  const [sm2Item, setSm2Item] = useState<Sm2State>(initialItem);

  const mergedConfig = { ...defaultConfig, ...config };

  const calculate = useCallback((quality: number) => {
    if (quality < 0 || quality > 5) {
      throw new Error("Quality must be between 0 and 5");
    }

    let { interval, repetitions, efactor } = sm2Item;
    const {
        efactorBaseIncrement,
        efactorQualityMultiplier,
        efactorQualityExponent,
        minEfactor,
        initialIntervals
    } = mergedConfig;

    if (quality < 3) {
      repetitions = 0;
      interval = 1; // On failure, interval always resets to 1 day.
    } else {
      // The core SM-2 efactor calculation
      efactor = efactor + (efactorBaseIncrement - (5 - quality) * (efactorQualityMultiplier + (5 - quality) * efactorQualityExponent));
      
      if (efactor < minEfactor) {
        efactor = minEfactor;
      }

      repetitions += 1;

      if (repetitions === 1) {
        interval = initialIntervals[0];
      } else if (repetitions === 2) {
        interval = initialIntervals[1];
      } else {
        interval = Math.round(interval * efactor);
      }
    }
    
    const nextItemState = { interval, repetitions, efactor };
    setSm2Item(nextItemState);

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    console.log(`Next review in ${interval} days on ${nextReviewDate.toLocaleDateString()}`);

    return { ...nextItemState, nextReviewDate };
  }, [sm2Item, mergedConfig]);

  return { sm2Item, calculate };
};

export default useSm2;
