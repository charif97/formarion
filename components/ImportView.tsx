
import React, { useState, useRef } from 'react';
import { UploadIcon, XIcon } from './icons';
import type { NormalizedDocument } from '../types';
import { pdfAdapter, docxAdapter, notesAdapter } from '../services/adapters';

interface ImportViewProps {
  onGenerate: (text: string, title: string) => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  title: string;
}

export const ImportView: React.FC<ImportViewProps> = ({ onGenerate, isLoading, title }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<NormalizedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      let doc: NormalizedDocument;
      if (file.name.endsWith('.pdf')) doc = await pdfAdapter(file);
      else if (file.name.endsWith('.docx')) doc = await docxAdapter(file);
      else doc = notesAdapter(await file.text());
      setPendingDoc(doc);
    } catch (err) {
      alert("Erreur lors de l'analyse");
    } finally {
      setIsParsing(false);
    }
  };

  if (pendingDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 animate-fade-in">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 max-w-2xl w-full">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Document Analysé</h2>
          <p className="text-slate-500 font-medium mb-12">"{pendingDoc.title}" est prêt pour la déstructuration IA.</p>
          <div className="flex gap-4">
            <button onClick={() => setPendingDoc(null)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Changer</button>
            <button 
              onClick={() => onGenerate(pendingDoc.text, pendingDoc.title)}
              className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Générer l'Ontologie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4">{title}</h1>
        <p className="text-slate-500 font-medium mb-12">Déposez un PDF ou un document métier pour extraire son intelligence.</p>
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx" />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-4 border-dashed border-slate-200 p-20 rounded-[40px] cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-white transition-all shadow-sm">
            <UploadIcon className="w-8 h-8 text-indigo-500" />
          </div>
          <p className="text-lg font-black text-slate-800">Cliquez pour téléverser</p>
          <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">PDF ou DOCX uniquement</p>
        </div>
      </div>
    </div>
  );
};
