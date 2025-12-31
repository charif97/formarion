import React from 'react';
import type { StudentProfile } from '../types';

interface StudentProfileViewProps {
  student: StudentProfile;
  className: string;
  onBack: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ student, className, onBack }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <button 
            onClick={onBack} 
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors self-start"
        >
            &larr; Retour
        </button>
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
            <p className="text-gray-500 text-lg">{className}</p>
        </div>
      </div>

      {/* Profile Stats Block */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Détails du profil</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
             <div className="col-span-2 md:col-span-3 lg:col-span-1 bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 uppercase font-semibold">Nom</div>
                <div className="text-lg font-bold text-gray-800 mt-1 truncate">{student.name}</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Niveau</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">{student.level}</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">XP Total</div>
                <div className="text-2xl font-bold text-yellow-600 mt-1">{student.xp}</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Maîtrise</div>
                <div className="text-2xl font-bold text-primary-600 mt-1">{student.mastery}%</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Série</div>
                <div className="text-2xl font-bold text-orange-500 mt-1">{student.streak} 🔥</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Cartes</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{student.totalCardsStudied}</div>
             </div>
        </div>

        {/* Mastery Visualization */}
        <div>
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-700">Progression de la maîtrise</span>
                <span className="text-sm font-bold text-primary-700">{student.mastery}%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${student.mastery}%` }}
                />
            </div>
        </div>
      </div>
    </div>
  );
};