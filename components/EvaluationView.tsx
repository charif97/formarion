
import React, { useState, useEffect } from 'react';
import { generateStudySet } from '../services/geminiService';
import { evaluateStudySet, generateMarkdownReport, EvaluationReport } from '../lib/evaluationService';
import type { StudySet } from '../types';

interface EvaluationViewProps {
  onBack: () => void;
}

const testCorpus = [
    {
        title: "Academic PDF: Photosynthesis",
        objectives: ["Explain the role of chlorophyll", "Describe the Calvin Cycle"],
        content: `Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy, through a process that converts carbon dioxide and water into glucose. Chlorophyll is the green pigment that captures the energy from sunlight. The process has two stages: the light-dependent reactions and the Calvin Cycle. The Calvin Cycle uses ATP and NADPH to convert CO2 into sugar.`
    },
    {
        title: "Web Page: History of the Roman Empire",
        objectives: ["Identify the first emperor", "List reasons for the fall of Rome"],
        content: `The Roman Empire began with the accession of the first emperor, Augustus, in 27 BC. It grew to become one of the largest empires in the ancient world. The Western Roman Empire collapsed in 476 AD. Historians attribute its fall to a combination of factors, including barbarian invasions, economic troubles, and overexpansion.`
    },
    {
        title: "YouTube Transcript: Introduction to React",
        objectives: ["Define what a component is", "Explain the purpose of state"],
        content: `Welcome to this tutorial on React. React is a library for building user interfaces. The core idea is to break down your UI into small, reusable pieces called components. Each component can manage its own data using something called 'state'. When a component's state changes, React will re-render the component to reflect the new data.`
    }
];

export const EvaluationView: React.FC<EvaluationViewProps> = ({ onBack }) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [progress, setProgress] = useState(0);

  const runEvaluation = async () => {
    setIsEvaluating(true);
    setReport(null);
    setProgress(0);
    const results = [];

    for (let i = 0; i < testCorpus.length; i++) {
        const doc = testCorpus[i];
        try {
            const items = await generateStudySet(doc.content, doc.title);
            const studySet: StudySet = {
                id: `eval-${Date.now()}`,
                title: doc.title,
                createdAt: new Date().toISOString(),
                items: items,
                sourceText: doc.content
            };
            const result = evaluateStudySet(studySet, doc.objectives);
            results.push(result);
        } catch(error) {
            console.error(`Failed to evaluate document: ${doc.title}`, error);
            results.push({
                documentTitle: doc.title,
                validItemRate: 0,
                coverageScore: 0,
                avgMcqQuality: 0,
                totalItems: 0,
                issues: ["Génération échouée. L'API a peut-être renvoyé une erreur ou un JSON invalide."]
            })
        }
        setProgress(((i + 1) / testCorpus.length) * 100);
    }
    
    setReport(generateMarkdownReport(results));
    setIsEvaluating(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
           <button onClick={onBack} className="text-sm text-primary-600 hover:underline mb-1">
              &larr; Back to Settings
           </button>
          <h1 className="text-3xl font-bold text-gray-800">AI Evaluation Dashboard</h1>
          <p className="text-gray-500 mt-1">Run automated quality checks on the AI generation pipeline.</p>
        </div>
        <button onClick={runEvaluation} disabled={isEvaluating} className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400">
            {isEvaluating ? 'Evaluating...' : 'Start New Evaluation'}
        </button>
      </div>

      {isEvaluating && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md">
        {report ? (
            <div className="prose max-w-none">
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                    <code>{report.markdown}</code>
                </pre>
            </div>
        ) : (
            <div className="text-center py-16">
                <h3 className="text-lg font-medium text-gray-600">No evaluation report yet.</h3>
                <p className="text-gray-500 mt-2">Click "Start New Evaluation" to generate a report.</p>
            </div>
        )}
      </div>
    </div>
  );
};
