
import React, { useState, useMemo } from 'react';
import type { StudySet, StudyItem, MCQ, TrueFalse } from '../types';
// FIX: Replaced non-existent `StudyIcon` with `BookOpenIcon` to resolve import error.
import { BookOpenIcon, DownloadIcon } from './icons';
import { exportToAnkiTxt } from '../lib/exportAnki';

interface DocumentViewProps {
  studySet: StudySet;
  onStudy: (set: StudySet) => void;
  onBack: () => void;
}

const ItemCard: React.FC<{ item: StudyItem }> = ({ item }) => {
    const typeColor = {
        'flashcard': 'bg-blue-100 text-blue-800',
        'mcq': 'bg-purple-100 text-purple-800',
        'free': 'bg-green-100 text-green-800',
        'case': 'bg-yellow-100 text-yellow-800',
        'true/false': 'bg-indigo-100 text-indigo-800',
    };
    
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <p className="text-gray-700 pr-4">{item.question}</p>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColor[item.type]}`}>{item.type}</span>
            </div>
             {item.type === 'mcq' && (
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                    {(item as MCQ).options.map((opt, index) => (
                        <li key={index} className={`${index === (item as MCQ).correctAnswerIndex ? 'font-bold text-primary-700' : ''}`}>
                            {String.fromCharCode(65 + index)}. {opt}
                        </li>
                    ))}
                </ul>
            )}
             {item.type === 'true/false' && (
                 <p className="mt-3 text-sm font-bold text-primary-700">
                    Réponse : {(item as TrueFalse).correctAnswer ? 'Vrai' : 'Faux'}
                </p>
            )}
        </div>
    )
}

export const DocumentView: React.FC<DocumentViewProps> = ({ studySet, onStudy, onBack }) => {

  const handleExportAnki = () => {
    try {
      exportToAnkiTxt(studySet);
    } catch(error) {
        alert("Échec de l'exportation pour Anki.");
        console.error(error);
    }
  };

  const dueTodayCount = useMemo(() => {
    const now = new Date();
    return studySet.items.filter(item => {
        if (!item.nextReviewAt) return true;
        return new Date(item.nextReviewAt) <= now;
    }).length;
  }, [studySet.items]);

  if (!studySet) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-700">Set d'étude non trouvé</h2>
              <button onClick={onBack} className="mt-4 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg">Retour</button>
          </div>
      );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
            <button onClick={onBack} className="text-sm text-primary-600 hover:underline mb-4">
                &larr; Retour
            </button>
            <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-primary-500">
                 <h1 className="text-3xl font-bold text-gray-800">{studySet.title}</h1>
                 <p className="text-gray-500 mt-1">Vous avez maintenant {studySet.items.length} questions pour vous aider à maîtriser les concepts.</p>
                <div className="flex items-center gap-4 mt-6">
                     {/* FIX: Added BookOpenIcon and classes for alignment. */}
                     <button onClick={() => onStudy(studySet)} className="flex items-center justify-center gap-2 flex-1 bg-primary-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-primary-700">
                        <BookOpenIcon className="w-5 h-5" />
                        Commencer à étudier
                    </button>
                    {/* FIX: Added DownloadIcon, clarified button text, and added classes for alignment. */}
                    <button onClick={handleExportAnki} className="flex items-center justify-center gap-2 flex-1 border-2 border-primary-600 text-primary-700 font-semibold py-3 px-6 rounded-lg hover:bg-primary-50">
                        <DownloadIcon className="w-5 h-5" />
                        Exporter pour Anki
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Aperçu des questions</h2>
                <div className="space-y-4">
                    {studySet.items.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
