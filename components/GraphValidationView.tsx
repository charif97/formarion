
import React from 'react';
import { KnowledgeGraph, KnowledgeNode } from '../types';
import { CheckIcon, TreeIcon } from './icons';

interface GraphValidationViewProps {
  graph: KnowledgeGraph;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GraphValidationView: React.FC<GraphValidationViewProps> = ({ graph, onConfirm, onCancel }) => {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Validation de l'Ontologie</h1>
          <p className="text-slate-500 font-medium">L'IA a déstructuré votre document en {graph.nodes.length} nœuds de savoir.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all">Annuler</button>
          <button onClick={onConfirm} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Déployer le parcours</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {graph.nodes.map((node) => (
          <div key={node.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-black text-slate-800">{node.label}</h3>
              <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase tracking-widest">Diff. {node.difficulty_weight}</span>
            </div>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{node.description}</p>
            
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atomes de Savoir</p>
              {node.content_atoms.map((atom, i) => (
                <div key={i} className="flex gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-indigo-400 font-bold">•</span>
                  {atom}
                </div>
              ))}
            </div>

            {node.prerequisites.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <TreeIcon className="w-3 h-3" /> Pré-requis
                </p>
                <div className="flex flex-wrap gap-2">
                  {node.prerequisites.map(preId => {
                    const preNode = graph.nodes.find(n => n.id === preId);
                    return (
                      <span key={preId} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                        {preNode?.label || preId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
