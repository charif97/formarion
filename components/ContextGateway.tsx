
import React, { useState } from 'react';
import { UserSignals } from '../types';
import { ClockIcon, LightBulbIcon } from './icons';

interface ContextGatewayProps {
  onStart: (signals: UserSignals) => void;
  onCancel: () => void;
}

export const ContextGateway: React.FC<ContextGatewayProps> = ({ onStart, onCancel }) => {
  const [time, setTime] = useState(10);
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [stress, setStress] = useState<'low' | 'medium' | 'high'>('low');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-xl w-full">
        <header className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-500/10 rounded-2xl mb-4">
             <LightBulbIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Moment de Contexte</h1>
          <p className="text-slate-400 font-medium">Calibrez votre état avant de plonger dans le savoir.</p>
        </header>

        <div className="bg-slate-800 border border-slate-700 p-8 rounded-[40px] shadow-2xl space-y-10">
          {/* Temps */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ClockIcon className="w-4 h-4" /> Temps disponible
              </label>
              <span className="text-2xl font-black text-indigo-400">{time} min</span>
            </div>
            <input 
              type="range" min="5" max="45" step="5" value={time} 
              onChange={(e) => setTime(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Énergie */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 block">Énergie Cognitive</label>
            <div className="grid grid-cols-3 gap-4">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergy(level)}
                  className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all border-2 
                    ${energy === level 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                >
                  {level === 'low' ? 'Batterie Faible' : level === 'medium' ? 'Stable' : 'Pleine Charge'}
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 block">Niveau de Stress</label>
            <div className="grid grid-cols-3 gap-4">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setStress(level)}
                  className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all border-2 
                    ${stress === level 
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                >
                  {level === 'low' ? 'Zen' : level === 'medium' ? 'Actif' : 'Sous Pression'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 flex flex-col gap-4">
            <button 
              onClick={() => onStart({ timeAvailable: time, energyLevel: energy, stressLevel: stress })}
              className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all transform hover:scale-[1.02] shadow-xl"
            >
              Initialiser la session
            </button>
            <button onClick={onCancel} className="text-slate-500 font-bold text-sm hover:text-white transition-colors">
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};