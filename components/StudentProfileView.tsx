import React, { useState, useEffect, useMemo } from 'react';
import type { StudentProfile } from '../types';
import { CheckIcon, XIcon, BookOpenIcon } from './icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentProfileViewProps {
  student: StudentProfile;
  className: string;
  onBack: () => void;
  onUpdate: (updatedStudent: StudentProfile) => void;
  readOnly?: boolean;
  onTrain?: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ student, className, onBack, onUpdate, readOnly = false, onTrain }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(student.name);
  const [editAvatarSeed, setEditAvatarSeed] = useState(student.avatarSeed || '');

  useEffect(() => {
    setEditName(student.name);
    setEditAvatarSeed(student.avatarSeed || '');
  }, [student]);

  const handleSave = () => {
    onUpdate({
      ...student,
      name: editName,
      avatarSeed: editAvatarSeed
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(student.name);
    setEditAvatarSeed(student.avatarSeed || '');
    setIsEditing(false);
  };

  // Generate chart data: Use history if available, otherwise generate a plausible trend line based on current mastery
  const chartData = useMemo(() => {
    if (student.history && student.history.length > 0) {
        return student.history.map(h => ({
            date: new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            fullDate: new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            mastery: h.mastery,
            xp: h.xp
        }));
    }

    // Fallback mock data generation
    const data = [];
    const days = 10;
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        // Simulate a learning curve
        const progress = i / (days - 1); // 0 to 1
        // Randomize slightly but trend upwards to current mastery
        const randomVar = Math.random() * 6 - 3; 
        const m = Math.max(0, Math.min(100, Math.round(student.mastery * (0.4 + 0.6 * progress) + randomVar)));
        
        data.push({
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            fullDate: date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            mastery: i === days - 1 ? student.mastery : m, // Ensure last point matches current
            xp: Math.round(student.xp * (0.8 + 0.2 * progress))
        });
    }
    return data;
  }, [student]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-xl text-sm z-50">
          <p className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">{data.fullDate}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Maîtrise</span>
                 </div>
                 <span className="font-bold text-gray-900">{payload[0].value}%</span>
            </div>
             <div className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">XP Total</span>
                 </div>
                 <span className="font-bold text-gray-900">{data.xp}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="w-full max-w-2xl">
                {isEditing ? (
                    <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-3xl font-bold text-gray-800 border-b-2 border-primary-500 focus:outline-none bg-transparent w-full mb-1"
                        autoFocus
                        placeholder="Nom du collaborateur"
                    />
                ) : (
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 group">
                        {student.name}
                        {!readOnly && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="opacity-0 group-hover:opacity-100 text-sm font-normal text-primary-600 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-md transition-opacity"
                            >
                                Modifier
                            </button>
                        )}
                    </h1>
                )}
                <p className="text-gray-500 text-lg">{className}</p>
            </div>
            
            <div className="flex items-center gap-3 self-end md:self-auto">
                {onTrain && (
                    <button
                        onClick={onTrain}
                        className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition-colors"
                    >
                        <BookOpenIcon className="w-5 h-5" />
                        S'entraîner
                    </button>
                )}

                {isEditing && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleCancel} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200" title="Annuler">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <button onClick={handleSave} className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700" title="Enregistrer">
                            <CheckIcon className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Profile Stats Block */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Fiche Collaborateur</h2>
             {!readOnly && !isEditing && (
                 <span className="text-xs text-gray-400">Cliquez sur les champs pour éditer</span>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div 
                className={`bg-gray-50 p-4 rounded-lg group ${!readOnly && !isEditing ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => !readOnly && !isEditing && setIsEditing(true)}
             >
                <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Nom Complet</div>
                {isEditing ? (
                    <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                ) : (
                    <div className="text-lg font-bold text-gray-800 truncate flex items-center justify-between">
                        {student.name}
                        {!readOnly && <span className="text-gray-400 opacity-0 group-hover:opacity-100">✎</span>}
                    </div>
                )}
             </div>
             
             <div 
                className={`bg-gray-50 p-4 rounded-lg group ${!readOnly && !isEditing ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => !readOnly && !isEditing && setIsEditing(true)}
             >
                <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Avatar (Emoji)</div>
                {isEditing ? (
                    <input 
                        type="text" 
                        value={editAvatarSeed}
                        onChange={(e) => setEditAvatarSeed(e.target.value)}
                        placeholder="ex: 🐵"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                ) : (
                    <div className="text-lg font-bold text-gray-800 flex items-center justify-between">
                        {student.avatarSeed || 'N/A'}
                         {!readOnly && <span className="text-gray-400 opacity-0 group-hover:opacity-100">✎</span>}
                    </div>
                )}
             </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Niveau</div>
                <div className="text-2xl font-bold text-purple-600 mt-1">{student.level}</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">XP Total</div>
                <div className="text-2xl font-bold text-yellow-600 mt-1">{student.xp}</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Compétence</div>
                <div className="text-2xl font-bold text-primary-600 mt-1">{student.mastery}%</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Assiduité</div>
                <div className="text-2xl font-bold text-orange-500 mt-1">{student.streak} 🔥</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase font-semibold">Concepts</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{student.totalCardsStudied}</div>
             </div>
        </div>

        {/* Mastery Visualization with Interactive Tooltip */}
        <div className="border-t pt-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Évolution de la performance</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">10 derniers jours</span>
            </div>
            <div className="h-[350px] w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
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
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                            type="monotone" 
                            dataKey="mastery" 
                            stroke="#22c55e" 
                            fillOpacity={1} 
                            fill="url(#colorMastery)" 
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#22c55e' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};