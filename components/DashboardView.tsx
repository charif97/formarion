import React from 'react';
import { UserRole, Class, StudySet, MasteryLayer } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { CheckIcon, LightBulbIcon, ClockIcon, BookOpenIcon, ChevronDownIcon, TrophyIcon } from './icons';

interface DashboardProps {
  classes: Class[];
  onNewSet: () => void;
  onStartStudySet: (set: StudySet) => void;
  onStartDailyReview: () => void;
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  mastery: number; // Score global réel
  role: UserRole;
  dueCount: number;
  dueOnlyCount: number;
  newCount: number;
  totalItems: number;
  masteredNodes: number;
  totalNodes: number;
  streak?: number;
  masteryLayer?: MasteryLayer;
  nodeLabels?: Record<string, string>;
}

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; color?: string; icon?: React.ReactNode }> = ({ title, value, subtext, color = "text-slate-800", icon }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div>
            <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                {icon && <div className="text-slate-300">{icon}</div>}
            </div>
            <p className={`text-4xl font-black ${color}`}>{value}</p>
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-3 font-bold">{subtext}</p>}
    </div>
);

// --- 1. COLLABORATOR VIEW ---
const CollaboratorDashboard: React.FC<DashboardProps> = (props) => {
    const { 
        onStartDailyReview, level, currentXp, xpForNextLevel, mastery, 
        dueCount, dueOnlyCount, newCount, totalItems, masteredNodes, totalNodes, 
        streak, onNewSet
    } = props;

    const masteryRatio = totalNodes > 0 ? (masteredNodes / totalNodes) * 100 : 0;
    const coverageRatio = totalNodes > 0 ? Math.min(100, (totalItems / (totalNodes * 3)) * 100) : 0; // Estimation: 3 items/noeud

    const progressionData = [
        { name: 'Maîtrise', value: mastery, color: '#6366f1' },
        { name: 'Concepts', value: masteryRatio, color: '#10b981' },
        { name: 'Contenu', value: coverageRatio, color: '#f59e0b' }
    ];

    if (totalNodes === 0 && totalItems === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center animate-fade-in">
                <div className="p-6 bg-slate-50 rounded-full mb-6">
                    <BookOpenIcon className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Votre jungle est vide</h3>
                <p className="text-slate-400 font-medium max-w-sm mb-8">Importez votre premier document pour que l'IA puisse générer votre parcours de maîtrise.</p>
                <button onClick={onNewSet} className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                    Importer du contenu
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Grille de stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="À réviser" 
                    value={dueCount} 
                    subtext={`${dueOnlyCount} anciens • ${newCount} nouveaux`} 
                    color="text-rose-600"
                    icon={<ClockIcon className="w-5 h-5" />}
                />
                <StatCard 
                    title="Série" 
                    value={`${streak || 0} Jours`} 
                    subtext="Assiduité actuelle" 
                    color="text-amber-500"
                    icon="🔥"
                />
                <StatCard 
                    title="Concepts" 
                    value={masteredNodes} 
                    subtext={`sur ${totalNodes} identifiés`} 
                    color="text-emerald-600"
                    icon={<CheckIcon className="w-5 h-5" />}
                />
                <StatCard 
                    title="Score IA" 
                    value={`${mastery}%`} 
                    subtext="Niveau de rétention" 
                    color="text-indigo-600"
                    icon={<LightBulbIcon className="w-5 h-5" />}
                />
            </div>

            {/* Widgets Centraux */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Progression réelle */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Progression du Savoir</h3>
                            <p className="text-sm text-slate-400 font-medium">Analyse temps réel de votre base de connaissance</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Niveau actuel</span>
                            <span className="text-2xl font-black text-indigo-600">{level}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {progressionData.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">{item.name}</span>
                                    <span className="text-sm font-black text-slate-400">{Math.round(item.value)}%</span>
                                </div>
                                <div className="w-full bg-slate-50 h-4 rounded-full overflow-hidden border border-slate-100">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                                {level}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">{currentXp} / {xpForNextLevel} XP</p>
                                <p className="text-xs text-slate-400 font-medium">Prochain niveau à {xpForNextLevel - currentXp} XP</p>
                            </div>
                         </div>
                         <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${(currentXp/xpForNextLevel)*100}%` }}></div>
                         </div>
                    </div>
                </div>

                {/* Backlog & Actions */}
                <div className="flex flex-col gap-6">
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl shadow-slate-200 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objectif du jour</span>
                            </div>
                            <h4 className="text-2xl font-black mb-2">
                                {dueCount >= 20 ? "Réduire le backlog" : dueCount > 0 ? "Consolider vos acquis" : "Explorer le savoir"}
                            </h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                {dueCount > 0 
                                    ? `L'IA a identifié ${dueCount} items prioritaires pour optimiser votre courbe d'oubli.`
                                    : "Votre mémoire est parfaitement synchronisée. C'est le moment d'importer de nouveaux concepts."
                                }
                            </p>
                        </div>
                        <div className="mt-8 space-y-3">
                            <button 
                                onClick={onStartDailyReview}
                                disabled={dueCount === 0}
                                className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${dueCount > 0 ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                {dueCount > 0 ? "Réviser maintenant" : "Rien à réviser"}
                            </button>
                            <button 
                                onClick={onNewSet}
                                className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                <AddIcon className="w-4 h-4" />
                                Importer / Enrichir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. MANAGER VIEW ---
const ManagerDashboard: React.FC<DashboardProps> = (props) => {
    const { mastery, dueCount, totalItems, masteredNodes, totalNodes } = props;

    // Calculs réels pour insights
    const healthScore = Math.max(0, Math.min(100, 100 - dueCount * 2));
    const retentionLevel = mastery >= 75 ? "Forte" : mastery >= 50 ? "Moyenne" : "Critique";
    const backlogStatus = dueCount >= 30 ? "Risque Élevé" : dueCount >= 10 ? "Modéré" : "Sain";

    const insights = [
        {
            title: `Charge de révision : ${backlogStatus}`,
            evidence: `Le backlog contient ${dueCount} items. ${dueCount > 20 ? "La mémorisation risque de chuter." : "Le flux est sous contrôle."}`,
            action: dueCount > 0 ? "Planifier une session de maintenance" : "Continuer l'expansion",
            type: dueCount >= 20 ? 'risk' : 'info'
        },
        {
            title: `Rétention globale : ${retentionLevel}`,
            evidence: `Score de maîtrise à ${mastery}%. ${mastery < 60 ? "Nécessite un renforcement des fondamentaux." : "Socle de connaissance solide."}`,
            action: mastery < 70 ? "Activer le mode Remédiation" : "Passer en mode Socratique",
            type: mastery < 60 ? 'risk' : 'success'
        }
    ];

    const chartData = [
        { name: 'Due', value: dueCount },
        { name: 'Concepts', value: totalNodes },
        { name: 'Acquis', value: masteredNodes },
        { name: 'Items', value: totalItems }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Insights Réels */}
            <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4" /> Analyse du flux de savoir
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.map((ins, i) => (
                        <div key={i} className={`p-8 rounded-[40px] border ${ins.type === 'risk' ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'} shadow-sm flex flex-col justify-between`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className={`font-black text-lg ${ins.type === 'risk' ? 'text-rose-900' : 'text-indigo-900'}`}>{ins.title}</h4>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${ins.type === 'risk' ? 'bg-rose-200 text-rose-700' : 'bg-indigo-200 text-indigo-700'}`}>
                                        {ins.type === 'risk' ? 'ALERTE' : 'INFO'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8">
                                    {ins.evidence}
                                </p>
                            </div>
                            <button className={`w-full py-4 px-6 rounded-2xl font-black text-xs transition-all shadow-md ${ins.type === 'risk' ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}>
                                {ins.action}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visualisation Metrics */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-8">Metrics de l'Espace</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={0.1} fill="#6366f1" />
                            </AreaChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                {/* KPIs Réels */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-8">Santé de l'Espace</h3>
                    <div className="space-y-6">
                        {[
                            { name: 'Maîtrise Globale', val: mastery, color: 'bg-indigo-500' },
                            { name: 'Taux de Validation', val: totalNodes > 0 ? (masteredNodes/totalNodes)*100 : 0, color: 'bg-emerald-500' },
                            { name: 'Indice Santé Backlog', val: healthScore, color: healthScore < 50 ? 'bg-rose-500' : 'bg-amber-500' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    <span>{item.name}</span>
                                    <span className="text-slate-900">{Math.round(item.val)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-700 ${item.color}`} 
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
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            {props.role === UserRole.Manager ? "Tableau de Bord Stratégique" : "Mon Hub de Maîtrise"}
                        </h1>
                        <p className="text-slate-400 font-medium mt-2">
                            {props.role === UserRole.Manager 
                                ? "Pilotage réel de la performance cognitive de l'espace."
                                : "Votre progression réelle calculée par l'IA."}
                        </p>
                    </div>
                    {props.streak && props.streak > 0 && (
                        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Série</p>
                                <p className="text-lg font-black text-slate-900">{props.streak} Jours</p>
                            </div>
                        </div>
                    )}
                </header>

                {props.role === UserRole.Manager ? <ManagerDashboard {...props} /> : <CollaboratorDashboard {...props} />}
             </div>
        </div>
    );
};

const AddIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
