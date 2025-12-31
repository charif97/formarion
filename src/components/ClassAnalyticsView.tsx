import React, { useMemo } from 'react';
import type { Class, StudentProfile } from '../types';

interface ClassAnalyticsViewProps {
  classData: Class;
  onBack: () => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const ClassAnalyticsView: React.FC<ClassAnalyticsViewProps> = ({ classData, onBack, onOpenStudentProfile }) => {
  
  const stats = useMemo(() => {
    if (!classData.activity || classData.activity.length === 0) {
      return {
        totalCards: 0,
        activeDays: 0,
        avgActiveStudents: 0
      };
    }

    const totalCards = classData.activity.reduce((acc, curr) => acc + curr.cardsStudied, 0);
    const avgActiveStudents = classData.activity.reduce((acc, curr) => acc + curr.activeStudents, 0) / classData.activity.length;

    return {
      totalCards,
      activeDays: classData.activity.length,
      avgActiveStudents: Math.round(avgActiveStudents * 10) / 10
    };
  }, [classData.activity]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button onClick={onBack} className="text-sm text-primary-600 hover:underline mb-2">
             &larr; Retour à mes cours
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{classData.name}</h1>
          <p className="text-gray-500 mt-1">Tableau de bord de la classe</p>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <p className="text-4xl font-bold text-primary-600">{stats.totalCards}</p>
            <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">Cartes étudiées (Total)</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <p className="text-4xl font-bold text-gray-700">{stats.activeDays}</p>
            <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">Jours d'activité</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <p className="text-4xl font-bold text-blue-600">{stats.avgActiveStudents}</p>
            <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">Élèves actifs (Moyenne)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Mastery History (Simple Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Historique de la maîtrise moyenne</h2>
            <div className="space-y-3">
                {classData.activity && classData.activity.length > 0 ? (
                    classData.activity.map((point, index) => (
                        <div key={index} className="flex items-center text-sm">
                            <span className="w-24 text-gray-500 flex-shrink-0">{new Date(point.date).toLocaleDateString()}</span>
                            <div className="flex-grow h-6 bg-gray-100 rounded-full overflow-hidden relative">
                                <div 
                                    className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${point.avgMastery}%` }}
                                ></div>
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-600">
                                    {point.avgMastery}%
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 italic text-center py-8">Aucune donnée d'activité disponible.</p>
                )}
            </div>
        </div>

        {/* Student List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Liste des élèves</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase">
                        <tr>
                            <th className="p-3 rounded-tl-lg">Nom</th>
                            <th className="p-3">Maîtrise</th>
                            <th className="p-3">Niveau</th>
                            <th className="p-3">XP</th>
                            <th className="p-3">Série</th>
                            <th className="p-3 rounded-tr-lg text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {classData.students && classData.students.length > 0 ? (
                            classData.students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 font-medium text-gray-800">{student.name}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${student.mastery >= 80 ? 'bg-green-500' : student.mastery >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${student.mastery}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{student.mastery}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-600">{student.level}</td>
                                    <td className="p-3 text-gray-600">{student.xp}</td>
                                    <td className="p-3 text-gray-600">{student.streak} 🔥</td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => onOpenStudentProfile(student.id)}
                                            className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                                        >
                                            Voir le profil
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                    Aucun élève dans cette classe.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};