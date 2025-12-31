import React, { useState, useMemo } from 'react';
import type { StudySet, StudyItem, MCQ, TrueFalse, UserContext, UserSignals } from '../types';
import { calculateSm2 } from '../lib/srs';
import { Feedback, FollowUpItem } from '../services/geminiService';
import { CheckIcon, ChatBubbleIcon, TrophyIcon, ClockIcon } from './icons';
import { ChatPanel } from './ChatPanel';

interface StudyViewProps {
  studySet: StudySet;
  studyQueue: StudyItem[];
  onUpdateItem: (item: StudyItem) => void;
  onFinish: () => void;
  onAddFollowUpItems: (items: FollowUpItem[], currentIndex: number) => void;
}

export const StudyView: React.FC<StudyViewProps> = ({ studySet, studyQueue, onUpdateItem, onFinish, onAddFollowUpItems }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionResults, setSessionResults] = useState<number[]>([]);

  const currentItem = useMemo(() => {
      if (currentIndex < 0 || currentIndex >= studyQueue.length) return null;
      return studyQueue[currentIndex];
  }, [studyQueue, currentIndex]);

  const handleNext = () => {
    if (currentIndex >= studyQueue.length - 1) {
      setCurrentIndex(studyQueue.length); // End state
    } else {
      setCurrentIndex(prev => prev + 1);
    }
    setShowAnswer(false);
    setSelectedAnswer(null);
    setUserAnswer('');
    setIsChatOpen(false);
  };

  const handleSrsRating = (quality: number) => {
    setSessionResults(prev => [...prev, quality]);
    if (!currentItem) return;
    
    const now = new Date();
    const updatedSrsState = calculateSm2(currentItem.sm2, quality, now);

    const updatedItem: StudyItem = {
      ...currentItem,
      sm2: {
        interval: updatedSrsState.interval,
        repetitions: updatedSrsState.repetitions,
        efactor: updatedSrsState.efactor,
      },
      lastReviewedAt: now.toISOString(),
      nextReviewAt: updatedSrsState.nextReviewAt.toISOString(),
    };
    
    onUpdateItem(updatedItem);
    handleNext();
  };

  // --- RENDERING CORE ---
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <div className={`flex-grow p-8 md:p-12 flex flex-col h-full transition-all duration-500 ease-in-out ${isChatOpen ? 'w-3/5' : 'w-full'}`}>
          {!currentItem ? (
              <div className="flex-grow flex items-center justify-center">
                  <div className="text-center animate-fade-in">
                      <div className="p-8 bg-emerald-50 text-emerald-600 rounded-full inline-block mb-6">
                          <TrophyIcon className="w-16 h-16" />
                      </div>
                      <h2 className="text-4xl font-black text-slate-900 mb-4">Session terminée !</h2>
                      <p className="text-slate-400 font-medium mb-12">L'IA a mis à jour votre état de maîtrise pédagogique.</p>
                      <button 
                        onClick={onFinish}
                        className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                      >
                          Retour au tableau de bord
                      </button>
                  </div>
              </div>
          ) : (
              <>
                <div className="mb-12">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{studySet.title}</span>
                            <h2 className="text-xl font-black text-slate-800 mt-1">Étape {currentIndex + 1} / {studyQueue.length}</h2>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                            <ClockIcon className="w-4 h-4" /> 
                            Session Orchestrée
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / studyQueue.length) * 100}%` }}></div>
                    </div>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
                    <div className="bg-slate-50 p-10 rounded-[40px] w-full text-center border border-slate-100 mb-8 shadow-inner">
                        <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{currentItem.question}</p>
                    </div>

                    <div className="w-full">
                        {showAnswer ? (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl relative">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Réponse de Référence</h4>
                                    <p className="text-lg text-emerald-900 font-medium">{(currentItem as any).answer || (currentItem as MCQ).options?.[(currentItem as MCQ).correctAnswerIndex || 0]}</p>
                                    <button 
                                        onClick={() => setIsChatOpen(true)}
                                        className="absolute top-6 right-6 p-3 bg-white text-emerald-600 rounded-xl shadow-sm hover:shadow-md transition-all"
                                    >
                                        <ChatBubbleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="flex gap-4">
                                    <button onClick={() => handleSrsRating(1)} className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 font-black hover:bg-slate-100 transition-all">À REVOIR</button>
                                    <button onClick={() => handleSrsRating(5)} className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-lg hover:bg-indigo-700 transition-all">C'EST COMPRIS</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(currentItem.type === 'mcq') && (currentItem as MCQ).options.map((opt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => { setSelectedAnswer(i); setShowAnswer(true); }}
                                        className="w-full p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group bg-white shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-black text-xs transition-colors">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="font-bold text-slate-700">{opt}</span>
                                        </div>
                                    </button>
                                ))}
                                {(currentItem.type === 'flashcard' || currentItem.type === 'free' || currentItem.type === 'case' || currentItem.type === 'true/false') && (
                                    <div className="space-y-4">
                                        <textarea 
                                            value={userAnswer}
                                            onChange={e => setUserAnswer(e.target.value)}
                                            className="w-full h-40 p-6 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 focus:outline-none font-medium text-slate-800 shadow-inner"
                                            placeholder="Tapez votre réponse pour valider l'atome de savoir..."
                                        />
                                        <button 
                                            onClick={() => setShowAnswer(true)}
                                            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all"
                                        >
                                            Vérifier ma pensée
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
              </>
          )}
      </div>
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        currentItem={currentItem} 
        sourceText={studySet.sourceText || ''} 
      />
    </div>
  );
};