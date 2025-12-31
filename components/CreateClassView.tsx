
import React, { useState } from 'react';

interface CreateClassViewProps {
  onCreate: (name: string) => void;
  onBack: () => void;
}

export const CreateClassView: React.FC<CreateClassViewProps> = ({ onCreate, onBack }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center h-full">
        <div className="w-full max-w-md">
             <button onClick={onBack} className="text-sm text-primary-600 hover:underline mb-4">
                &larr; Retour à mes cours
             </button>
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Créer une nouvelle classe</h1>
            <p className="text-gray-500 text-center mb-8">Donnez un nom à votre classe, par exemple "Biologie 101" ou "Histoire de l'Art".</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de la classe"
                    className="w-full p-4 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Créer
                </button>
            </form>
        </div>
    </div>
  );
};
