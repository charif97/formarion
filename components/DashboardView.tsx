import React from 'react';
import { UserRole, Class, StudySet } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { CheckIcon, LightBulbIcon, ClockIcon, BookOpenIcon } from './icons';

interface DashboardProps {
  classes: Class[];
  onNewSet: () => void;
  onStartStudySet: (set: StudySet) => void;
  onStartDailyReview: () => void;
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  mastery: number;
  role: UserRole;
  // Statistiques réelles
  dueCount: number;
  dueOnlyCount: number;
  newCount: number;
  totalItems: number;
  masteredNodes: number;
  totalNodes: number;
}

const CollaboratorDashboard: React.FC<DashboardProps> = (props) => {
    const { onStartDailyReview, level, currentXp, xpForNextLevel, mastery, dueCount, dueOnlyCount, newCount, totalItems, masteredNodes, totalNodes } = props;

    const masteryData = [
        { subject: 'Conformité', mastery: 85 },
        { subject: 'Crédit', mastery: 45 },
        { subject: 'Soft Skills', mastery: 90 },
        { subject: 'Process', mastery: 65 },
        { subject: 'Risques', mastery: 30 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Real Stats Widgets Section (MVP) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Revision Widget */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Révision</span>
                            <ClockIcon className="w-5 h-5 text-rose-200" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">À réviser aujourd'hui</h4>
                        <p className="text-4xl font-black text-slate-900">{dueCount}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          {dueOnlyCount} dus • {newCount} nouveaux
                        </p>
                    </div>
                    <button 
                        onClick={onStartDailyReview}
                        disabled={dueCount === 0}
                        className={`mt-6 w-full py-3 rounded-2xl font-black text-sm transition-all shadow-sm ${
                            dueCount > 0 
                            ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100 transform hover:scale-[1.02]' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                        }`}
                    >
                        {dueCount > 0 ? "Commencer la révision" : "Tout est à jour"}
                    </button>
                </div>

                {/* Items Widget */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Contenu</span>
                            <BookOpenIcon className="w-5 h-5 text-indigo-200" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Items Totaux</h4>
                        <p className="text-4xl font-black text-slate-900">{totalItems}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Générés par l'IA</p>
                    </div>
                    <button 
                        onClick={props.onNewSet}
                        className="mt-6 w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm transition-all hover:bg-indigo-100"
                    >
                        Importer plus
                    </button>
                </div>

                {/* Mastery Widget */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Maîtrise</span>
                            <CheckIcon className="w-5 h-5 text-emerald-200" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Concepts acquis</h4>
                        <p className="text-4xl font-black text-slate-900">{masteredNodes}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">sur {totalNodes} concepts identifiés</p>
                    </div>
                    <div className="mt-6">
                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalNodes > 0 ? (masteredNodes/totalNodes)*100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Global Performance Widget */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Performance</span>
                            <LightBulbIcon className="w-5 h-5 text-amber-200" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Maîtrise globale</h4>
                        <p className="text-4xl font-black text-slate-900">{mastery}%</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Score de rétention moyen</p>
                    </div>
                    <div className="mt-6">
                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${mastery}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Knowledge Graph Card */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Profil de Compétences</h3>
                            <p className="text-sm text-slate-400 font-medium">Visualisation de vos domaines de connaissances</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                            Niveau {level}
                        </span>
                    </div>
                    
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Maîtrise"
                                    dataKey="mastery"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.15}
                                    strokeWidth={4}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Progression & XP */}
                <div className="flex flex-col gap-6">
                    <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col justify-between flex-grow">
                        <div>
                            <h4 className="text-2xl font-black mb-2">Continuez à apprendre</h4>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                                {dueCount > 0 
                                  ? `Vous avez ${dueCount} items qui attendent votre attention. La répétition espacée est la clé du succès.`
                                  : "Votre mémoire est parfaitement à jour ! C'est le moment idéal pour explorer de nouveaux concepts."
                                }
                            </p>
                        </div>
                        <button 
                            onClick={dueCount > 0 ? onStartDailyReview : props.onNewSet}
                            className="mt-8 bg-white text-indigo-600 font-black py-4 px-6 rounded-2xl hover:bg-indigo-50 transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            {dueCount > 0 ? "Reprendre l'étude" : "Nouvelle importation"}
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Barre de progression XP</p>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-black text-slate-800">{currentXp}</span>
                            <span className="text-sm font-bold text-slate-400">/{xpForNextLevel} XP</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(currentXp/xpForNextLevel)*100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ManagerDashboard: React.FC<DashboardProps> = () => {
    const teamPerf = [
        { name: 'Rabat Agdal', mastery: 72 },
        { name: 'Casablanca Anfa', mastery: 85 },
        { name: 'Tanger Centre', mastery: 64 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4" /> Analyse prédictive IA
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl border bg-rose-50 border-rose-100 shadow-sm">
                        <h4 className="font-black text-rose-900 mb-2">Risque de conformité</h4>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          L'équipe Tanger Centre présente une chute de rétention de 15% sur le module RGPD. Une session de rappel est suggérée.
                        </p>
                    </div>
                    <div className="p-6 rounded-3xl border bg-indigo-50 border-indigo-100 shadow-sm">
                        <h4 className="font-black text-indigo-900 mb-2">Opportunité de formation</h4>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          Casablanca Anfa a complété 90% du socle commun. Ils sont prêts pour le module avancé "Crédit Immobilier".
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-6">Maîtrise par Équipe</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={teamPerf}>
                                <defs>
                                    <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                                <YAxis hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="mastery" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorM)" />
                            </AreaChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-6">Audits de Conformité</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'LCB-FT', val: 92, status: 'OK' },
                            { name: 'RGPD', val: 78, status: 'WARM' },
                            { name: 'Éthique', val: 100, status: 'OK' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                    <span>{item.name}</span>
                                    <span className={item.status === 'OK' ? 'text-emerald-500' : 'text-amber-500'}>{item.val}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${item.status === 'OK' ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                        style={{ width: `${item.val}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DashboardView: React.FC<DashboardProps> = (props) => {
    return (
        <div className="p-8 sm:p-12 bg-slate-50 min-h-screen">
             <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {props.role === UserRole.Manager ? "Tableau de Bord Stratégique" : "Mon Hub de Maîtrise"}
                    </h1>
                    <p className="text-slate-400 font-medium mt-2">
                        {props.role === UserRole.Manager 
                            ? "Assisté par l'IA pour le pilotage de la conformité et des compétences."
                            : "L'IA personnalise votre parcours selon vos objectifs de carrière."}
                    </p>
                </header>

                {props.role === UserRole.Manager ? <ManagerDashboard {...props} /> : <CollaboratorDashboard {...props} />}
             </div>
        </div>
    );
};
