import type { StudySet, StudyItem, MCQ } from '../types';

export interface EvaluationResult {
    documentTitle: string;
    validItemRate: number; // 0-1
    coverageScore: number; // 0-1
    avgMcqQuality: number; // 0-1
    totalItems: number;
    issues: string[];
}

export interface EvaluationReport {
    overallScore: number;
    results: EvaluationResult[];
    markdown: string;
}

// --- METRIC CALCULATORS ---

/**
 * Checks if a generated item has the minimum required fields.
 */
function isValidItem(item: StudyItem): boolean {
    if (!item.type || !item.question) return false;
    if (item.type === 'mcq') {
        const mcq = item as MCQ;
        return mcq.options && mcq.options.length > 1 && mcq.correctAnswerIndex !== undefined;
    }
    if (item.type === 'flashcard' || item.type === 'free' || item.type === 'case') {
        return !!(item as any).answer;
    }
    return false;
}

/**
 * Heuristic to check if the generated items cover the learning objectives.
 * This is a simple keyword-based approach.
 */
function calculateCoverage(items: StudyItem[], objectives: string[]): { score: number, issues: string[] } {
    if (objectives.length === 0) return { score: 1, issues: [] };
    
    let coveredObjectives = 0;
    const issues: string[] = [];
    const allItemsText = items.map(i => `${i.question} ${(i as any).answer || ''} ${(i as MCQ).options?.join(' ')}`).join(' ').toLowerCase();

    for (const objective of objectives) {
        // Simple check if any keyword from the objective is in the generated content.
        const keywords = objective.toLowerCase().split(' ');
        if (keywords.some(kw => allItemsText.includes(kw))) {
            coveredObjectives++;
        } else {
            issues.push(`- L'objectif "${objective}" semble peu couvert.`);
        }
    }
    
    return { score: coveredObjectives / objectives.length, issues };
}

/**
 * Heuristic to evaluate the quality of MCQ distractors.
 * A good distractor is plausible and not trivially wrong.
 */
function evaluateMcqQuality(item: MCQ): { score: number, issues: string[] } {
    const issues: string[] = [];
    let qualityScore = 1.0;
    
    const correctAnswer = item.options[item.correctAnswerIndex];
    const distractors = item.options.filter((_, i) => i !== item.correctAnswerIndex);

    if (distractors.length < 2) {
        qualityScore -= 0.5;
        issues.push(`- QCM "${item.question.substring(0,20)}..." a moins de 2 distracteurs.`);
    }

    distractors.forEach(distractor => {
        // Trivial check: distractor is very short.
        if (distractor.length < 3) {
            qualityScore -= 0.2;
            issues.push(`- QCM "${item.question.substring(0,20)}..." a un distracteur trivialement court: "${distractor}".`);
        }
        // Trivial check: distractor is just a number when the answer is text, or vice versa.
        const isAnswerNumeric = !isNaN(parseFloat(correctAnswer));
        const isDistractorNumeric = !isNaN(parseFloat(distractor));
        if (isAnswerNumeric !== isDistractorNumeric) {
            qualityScore -= 0.3;
             issues.push(`- QCM "${item.question.substring(0,20)}..." a un distracteur d'un type différent de la réponse.`);
        }
    });

    return { score: Math.max(0, qualityScore), issues };
}


// --- MAIN EVALUATION FUNCTION ---

export const evaluateStudySet = (set: StudySet, objectives: string[]): EvaluationResult => {
    const { items } = set;
    const totalItems = items.length;
    
    const validItems = items.filter(isValidItem);
    const validItemRate = totalItems > 0 ? validItems.length / totalItems : 0;
    
    const coverage = calculateCoverage(validItems, objectives);
    const mcqs = validItems.filter(i => i.type === 'mcq') as MCQ[];
    
    const mcqEvaluations = mcqs.map(evaluateMcqQuality);
    const totalMcqQuality = mcqEvaluations.reduce((sum, current) => sum + current.score, 0);
    const avgMcqQuality = mcqs.length > 0 ? totalMcqQuality / mcqs.length : 1; // Score is 1 if no MCQs

    const issues = [
        ...(validItemRate < 1 ? [`- ${totalItems - validItems.length}/${totalItems} items sont invalides (champs manquants).`] : []),
        ...coverage.issues,
        ...mcqEvaluations.flatMap(e => e.issues)
    ];

    return {
        documentTitle: set.title,
        validItemRate,
        coverageScore: coverage.score,
        avgMcqQuality,
        totalItems,
        issues
    };
};

// --- REPORT GENERATOR ---

export const generateMarkdownReport = (allResults: EvaluationResult[]): EvaluationReport => {
    let totalScore = 0;
    let scoreCount = 0;

    const resultsMarkdown = allResults.map(res => {
        const itemScore = (res.validItemRate * 0.4) + (res.coverageScore * 0.4) + (res.avgMcqQuality * 0.2);
        totalScore += itemScore;
        scoreCount++;

        return `
### 📄 Document: ${res.documentTitle}
- **Score de Qualité**: ${itemScore.toFixed(2)} / 1.00
- **Taux d'Items Valides**: ${res.validItemRate.toFixed(2)} (${(res.validItemRate * 100).toFixed(0)}%)
- **Couverture des Objectifs**: ${res.coverageScore.toFixed(2)} (${(res.coverageScore * 100).toFixed(0)}%)
- **Qualité des QCM**: ${res.avgMcqQuality.toFixed(2)} (${(res.avgMcqQuality * 100).toFixed(0)}%)
${res.issues.length > 0 ? `\n**🚨 Problèmes identifiés:**\n${res.issues.join('\n')}` : '\n**✅ Aucune problème majeur identifié.**'}
        `;
    }).join('\n---\n');

    const overallScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    const summary = `
## 📊 Rapport d'Évaluation de l'IA
**Date:** ${new Date().toLocaleString()}

### Score Global: ${(overallScore * 100).toFixed(1)} / 100

---
${resultsMarkdown}

---

### 💡 Axes d'Amélioration Suggérés
- **Si le taux d'items valides est bas**: Vérifier le prompt système et le schéma JSON. L'IA ne respecte peut-être pas le format de sortie attendu.
- **Si la couverture est basse**: Affiner le prompt pour mieux guider l'IA sur les concepts clés à extraire. L'ajout de "learning_goals" dans la requête peut aider.
- **Si la qualité des QCM est basse**: Renforcer les instructions dans le prompt système concernant la création de distracteurs "plausibles et non-triviaux", en donnant des exemples de ce qu'il faut éviter.
    `;

    return {
        overallScore,
        results: allResults,
        markdown: summary.trim(),
    };
};
