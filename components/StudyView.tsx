import React, { useState, useMemo } from 'react';
import type { StudySet, StudyItem, MCQ, TrueFalse } from '../types';
import { calculateSm2 } from '../lib/srs';
import { TrophyIcon, ClockIcon } from './icons';

interface StudyViewProps {
  studySet: StudySet;
  studyQueue: StudyItem[];
  onUpdateItem: (item: StudyItem) => void;
  onFinish: () => void;
}

export const StudyView: React.FC<StudyViewProps> = ({ studySet, studyQueue, onUpdateItem, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const currentItem = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= studyQueue.length) return null;
    return studyQueue[currentIndex];
  }, [studyQueue, currentIndex]);

  const handleNext = () => {
    if (currentIndex >= studyQueue.length - 1) {
      setCurrentIndex(studyQueue.length);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    setShowAnswer(false);
    setUserAnswer('');
  };

  const handleSrsRating = (quality: number) => {
    if (!currentItem) return;
    const now = new Date();
    
    // Calcul de l'état SRS suivant via SM-2
    const updatedSrsState = calculateSm2(currentItem.sm2, quality, now);
    
    // On propage l'intégralité de currentItem (dont sourceNodeId, sourceAtoms, atomCoverage)
    // On patche uniquement les métadonnées de progression
    const updatedItem: StudyItem = {
      ...currentItem,
      sm2: {
        interval: updatedSrsState.interval,
        repetitions: updatedSrsState.repetitions,
        efactor: updatedSrsState.efactor,
      },
      lastReviewedAt: now.toISOString(),
      nextReviewAt: updatedSrsState.nextReviewAt.toISOString(),
      lastQuality: quality,
    };
    
    onUpdateItem(updatedItem);
    handleNext();
  };

  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8 text-center animate-fade-in">
        <div className="p-8 bg-emerald-50 text-emerald-600 rounded-full inline-block mb-6">
          <TrophyIcon className="w-16 h-16" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4">Session terminée !</h2>
        <p className="text-slate-400 font-medium mb-12">Votre état de maîtrise a été mis à jour par l'IA.</p>
        <button onClick={onFinish} className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const getCorrectAnswer = () => {
    if (currentItem.type === 'mcq') {
      const mcq = currentItem as MCQ;
      return mcq.options[mcq.correctAnswerIndex] || "N/A";
    }
    if (currentItem.type === 'true/false') {
      return (currentItem as TrueFalse).correctAnswer ? 'Vrai' : 'Faux';
    }
    return (currentItem as any).answer || "Pas de réponse de référence";
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans p-8 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{studySet.title}</span>
              <h2 className="text-xl font-black text-slate-800 mt-1">Étape {currentIndex + 1} / {studyQueue.length}</h2>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
              <ClockIcon className="w-4 h-4" /> Session de Maîtrise
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / studyQueue.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-full">
          <div className="bg-slate-50 p-10 rounded-[40px] w-full text-center border border-slate-100 mb-8 shadow-inner">
            <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{currentItem.question}</p>
          </div>

          <div className="w-full">
            {showAnswer ? (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Réponse de Référence</h4>
                  <p className="text-lg text-emerald-900 font-medium">{getCorrectAnswer()}</p>
                  {currentItem.explanation && (
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <p className="text-sm text-emerald-700 italic">{currentItem.explanation}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleSrsRating(1)} className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 font-black hover:bg-slate-100 transition-all">À REVOIR</button>
                  <button onClick={() => handleSrsRating(5)} className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-lg hover:bg-indigo-700 transition-all">C'EST COMPRIS</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentItem.type === 'mcq' ? (
                  (currentItem as MCQ).options.map((opt, i) => (
                    <button key={i} onClick={() => setShowAnswer(true)} className="w-full p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-black text-xs transition-colors">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="font-bold text-slate-700">{opt}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <>
                    <textarea value={userAnswer} onChange={e => setUserAnswer(e.target.value)} className="w-full h-40 p-6 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 focus:outline-none font-medium text-slate-800 shadow-inner" placeholder="Formulez votre réponse ici..." />
                    <button onClick={() => setShowAnswer(true)} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">Vérifier</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};