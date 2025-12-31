

import React, { useMemo, useState } from 'react';
import type { Class } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDownIcon, ChevronUpIcon } from './icons';

interface ClassAnalyticsViewProps {
  classData: Class;
  onBack: () => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const ClassAnalyticsView: React.FC<ClassAnalyticsViewProps> = ({ classData, onBack, onOpenStudentProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

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

  const filteredStudents = useMemo(() => {
    if (!classData.students) return [];
    if (!searchQuery) return classData.students;
    return classData.students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classData.students, searchQuery]);

  const chartData = useMemo(() => {
    if (!classData.activity) return [];
    return [...classData.activity]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(point => ({
        date: new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(point.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        avgMastery: point.avgMastery,
        cardsStudied: point.cardsStudied,
        activeStudents: point.activeStudents
      }));
  }, [classData.activity]);

  const toggleExpand = (studentId: string) => {
      setExpandedStudentId(prev => prev === studentId ? null : studentId);
  }

  // Simulation of module data per student since backend data structure is simplified
  const getMockModules = (studentName: string) => {
      // Deterministic mock based on name length for stability
      const seed = studentName.length;
      return [
          { name: 'LCB-FT 2025', progress: seed % 2 === 0 ? 100 : 45, status: seed % 2 === 0 ? 'Terminé' : 'En cours', score: seed % 2 === 0 ? 95 : null },
          { name: 'Phishing Awareness', progress: seed % 3 === 0 ? 10 : 80, status: seed % 3 === 0 ? 'En retard' : 'En cours', score: null },
          { name: 'Produits d\'Epargne', progress: 0, status: 'À démarrer', score: null }
      ];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg text-sm z-50">
          <p className="font-bold text-gray-800 mb-2">{data.fullDate}</p>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-3 h-3 rounded-full bg-primary-500"></div>
             <p className="text-gray-600">Maîtrise Moyenne: <span className="font-bold text-gray-900">{data.avgMastery}%</span></p>
          </div>
           <div className="flex items-center gap-2 mb-1">
             <div className="w-3 h-3 rounded-full bg-blue-500"></div>
             <p className="text-gray-600">Cartes Étudiées: <span className="font-bold text-gray-900">{data.cardsStudied}</span></p>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
             <p className="text-gray-600">Élèves Actifs: <span className="font-bold text-gray-900">{data.activeStudents}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button onClick={onBack} className="text-sm text-primary-600 hover:underline mb-2">
             &larr; Retour à mes cours
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{classData.name}</h1>
          <p className="text-gray-500 mt-1">Tableau de bord de la classe</p>
        </div>
      </div>

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
        
        {/* Mastery History Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Historique de la maîtrise moyenne</h2>
            {chartData.length > 0 ? (
                <div className="flex-grow w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 12 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 12 }} 
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                        <Bar 
                            dataKey="avgMastery" 
                            name="Maîtrise Moyenne" 
                            radius={[4, 4, 0, 0]} 
                            barSize={40}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.avgMastery >= 80 ? '#22c55e' : entry.avgMastery >= 50 ? '#eab308' : '#ef4444'} />
                            ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-gray-400 italic">
                    Aucune donnée d'activité disponible.
                </div>
            )}
        </div>

        {/* Student List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[500px] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h2 className="text-lg font-bold text-gray-800">Liste des élèves</h2>
                <input 
                    type="text" 
                    placeholder="Rechercher un élève..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-auto p-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                />
            </div>
            <div className="overflow-y-auto flex-grow">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase sticky top-0 z-10">
                        <tr>
                            <th className="p-3 rounded-tl-lg">Nom</th>
                            <th className="p-3">Maîtrise</th>
                            <th className="p-3">Niveau</th>
                            <th className="p-3">XP</th>
                            <th className="p-3 text-right">Profil</th>
                            <th className="p-3 rounded-tr-lg w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <React.Fragment key={student.id}>
                                    <tr className={`hover:bg-gray-50 transition-colors ${expandedStudentId === student.id ? 'bg-blue-50/30' : ''}`}>
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
                                        <td className="p-3 text-right">
                                            <button 
                                                onClick={() => onOpenStudentProfile(student.id)}
                                                className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                                            >
                                                Voir
                                            </button>
                                        </td>
                                        <td className="p-3 text-center cursor-pointer" onClick={() => toggleExpand(student.id)}>
                                            <div className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                                 {expandedStudentId === student.id ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedStudentId === student.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={6} className="p-4 border-t border-gray-200 border-b border-gray-100 shadow-inner">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Modules en cours & Progression</h4>
                                                <div className="space-y-3">
                                                    {getMockModules(student.name).map((mod, idx) => (
                                                        <div key={idx} className="flex items-center gap-4 bg-white p-2 rounded border border-gray-200">
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-gray-800 text-sm">{mod.name}</p>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-blue-500 rounded-full" 
                                                                            style={{ width: `${mod.progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-600 w-8 text-right">{mod.progress}%</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-24 text-right">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                                    mod.status === 'Terminé' ? 'bg-green-100 text-green-700' :
                                                                    mod.status === 'En retard' ? 'bg-red-100 text-red-700' :
                                                                    mod.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {mod.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                    {classData.students && classData.students.length > 0 ? "Aucun élève ne correspond à la recherche." : "Aucun élève dans cette classe."}
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