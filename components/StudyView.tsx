
import React, { useState, useMemo } from 'react';
/* Removed non-existent FreeResponse and CaseStudy from imports */
import type { StudySet, StudyItem, MCQ, TrueFalse, Flashcard, UserContext, UserSignals } from '../types';
import { calculateSm2 } from '../lib/srs';
import { getFeedbackOnAnswer, Feedback, FollowUpItem } from '../services/geminiService';
import { CheckIcon, ChatBubbleIcon, TrophyIcon, ClockIcon } from './icons';
import { ChatPanel } from './ChatPanel';

interface StudyViewProps {
  studySet: StudySet;
  studyQueue: StudyItem[];
  onUpdateItem: (item: StudyItem) => void;
  onFinish: () => void;
  onAddFollowUpItems: (items: FollowUpItem[], currentIndex: number) => void;
}

const ContextGateway: React.FC<{ onStart: (signals: UserSignals) => void }> = ({ onStart }) => {
    const [time, setTime] = useState(10);
    const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');

    return (
        <div className="bg-white p-12 rounded-[40px] shadow-2xl max-w-xl mx-auto border border-slate-100 animate-fade-in-up">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Prêt pour votre session ?</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                L'IA adapte la méthode pédagogique à votre contexte actuel.
            </p>

            <div className="space-y-8 mb-12">
                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 block">Temps disponible</label>
                    <div className="flex gap-4">
                        {[5, 10, 20].map(t => (
                            <button 
                                key={t}
                                onClick={() => setTime(t)}
                                className={`flex-1 py-4 rounded-2xl font-black border-2 transition-all ${time === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                {t} min
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 block">Énergie cognitive</label>
                    <div className="flex gap-4">
                        {['low', 'medium', 'high'].map(e => (
                            <button 
                                key={e}
                                onClick={() => setEnergy(e as any)}
                                className={`flex-1 py-4 rounded-2xl font-black border-2 transition-all uppercase text-[10px] tracking-widest ${energy === e ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                {e === 'low' ? 'FATIGUÉ' : e === 'medium' ? 'OK' : 'OPTIMAL'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button 
                onClick={() => onStart({ timeAvailable: time, energyLevel: energy, stressLevel: 'medium' })}
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:scale-[1.02]"
            >
                Générer mon parcours adaptatif
            </button>
        </div>
    );
};

export const StudyView: React.FC<StudyViewProps> = ({ studySet, studyQueue, onUpdateItem, onFinish, onAddFollowUpItems }) => {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 is Gateway
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionResults, setSessionResults] = useState<number[]>([]);
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  const currentItem = useMemo(() => {
      if (currentIndex < 0 || currentIndex >= studyQueue.length) return null;
      return studyQueue[currentIndex];
  }, [studyQueue, currentIndex]);

  // Fix: handleStartSession now correctly includes signals as a known property of UserContext
  const handleStartSession = (signals: UserSignals) => {
      // In a real flow, this would call CAE service
      setUserContext({
          signals,
          focusScore: 80,
          sessionType: 'DeepWork',
          stateDescription: 'Calibration manuelle'
      });
      setCurrentIndex(0);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
    setShowAnswer(false);
    setSelectedAnswer(null);
    setUserAnswer('');
    setFeedback(null);
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

  if (currentIndex === -1) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
              <ContextGateway onStart={handleStartSession} />
          </div>
      );
  }

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
                      <p className="text-slate-400 font-medium mb-12">L'IA a mis à jour votre graphe de maîtrise.</p>
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
                            {/* Fix: signals property is now recognized on UserContext type */}
                            {userContext?.signals?.timeAvailable} min restantes
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / studyQueue.length) * 100}%` }}></div>
                    </div>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
                    <div className="bg-slate-50 p-10 rounded-[40px] w-full text-center border border-slate-100 mb-8">
                        <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{currentItem.question}</p>
                    </div>

                    <div className="w-full">
                        {showAnswer ? (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl relative">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Réponse IA</h4>
                                    <p className="text-lg text-emerald-900 font-medium">{(currentItem as any).answer || (currentItem as MCQ).options?.[(currentItem as MCQ).correctAnswerIndex]}</p>
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
                                        className="w-full p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-black text-xs transition-colors">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="font-bold text-slate-700">{opt}</span>
                                        </div>
                                    </button>
                                ))}
                                {(currentItem.type === 'flashcard' || currentItem.type === 'free' || currentItem.type === 'case') && (
                                    <div className="space-y-4">
                                        <textarea 
                                            value={userAnswer}
                                            onChange={e => setUserAnswer(e.target.value)}
                                            className="w-full h-40 p-6 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 focus:outline-none font-medium text-slate-800"
                                            placeholder="Tapez votre réponse ici pour analyse..."
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
