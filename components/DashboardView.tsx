import React from 'react';
import { UserRole, Class, StudySet, MasteryLayer } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { CheckIcon, LightBulbIcon, ClockIcon, BookOpenIcon, AddIcon } from './icons';

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

    // Calculs réels pour progression
    const masteredRatio = totalNodes > 0 ? (masteredNodes / totalNodes) * 100 : 0;
    // Heuristique : On considère le contenu couvert si on a au moins 3 items par noeud
    const coverageRatio = totalNodes > 0 ? Math.min(100, (totalItems / Math.max(1, totalNodes * 3)) * 100) : 0;

    const progressionStats = [
        { label: "Maîtrise globale", value: mastery, color: "bg-indigo-600" },
        { label: "Concepts acquis", value: masteredRatio, color: "bg-emerald-500" },
        { label: "Contenu couvert", value: coverageRatio, color: "bg-amber-500" }
    ];

    // État vide
    if (totalNodes === 0 && totalItems === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center animate-fade-in">
                <div className="p-6 bg-slate-50 rounded-full mb-6">
                    <BookOpenIcon className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Votre jungle est vide</h3>
                <p className="text-slate-400 font-medium max-w-sm mb-8">Importez votre premier document pour que l'IA puisse générer votre parcours de maîtrise personnalisé.</p>
                <button onClick={onNewSet} className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <AddIcon className="w-5 h-5" /> Importer du contenu
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Grille de statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="À réviser" 
                    value={dueCount} 
                    subtext={`${dueOnlyCount} dus • ${newCount} nouveaux`} 
                    color="text-rose-600"
                    icon={<ClockIcon className="w-5 h-5" />}
                />
                <StatCard 
                    title="Série" 
                    value={`${streak || 0} Jours`} 
                    subtext="Assiduité actuelle" 
                    color="text-amber-500"
                    icon={<span className="text-xl">🔥</span>}
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
                    subtext="Niveau de mémorisation" 
                    color="text-indigo-600"
                    icon={<LightBulbIcon className="w-5 h-5" />}
                />
            </div>

            {/* Widgets Centraux */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Progression du Savoir */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Progression du Savoir</h3>
                            <p className="text-sm text-slate-400 font-medium">Visualisation réelle de vos acquis document par document</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Niveau</span>
                            <span className="text-2xl font-black text-indigo-600">{level}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {progressionStats.map((stat, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-black text-slate-700 uppercase">{stat.label}</span>
                                    <span className="text-sm font-black text-slate-900">{Math.round(stat.value)}%</span>
                                </div>
                                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${stat.color}`} 
                                        style={{ width: `${stat.value}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg">
                                {level}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">{currentXp} / {xpForNextLevel} XP</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">XP restant : {Math.max(0, xpForNextLevel - currentXp)}</p>
                            </div>
                         </div>
                         <div className="hidden sm:block w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${(currentXp / Math.max(1, xpForNextLevel)) * 100}%` }}></div>
                         </div>
                    </div>
                </div>

                {/* Backlog & Actions Rapides */}
                <div className="flex flex-col gap-6">
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl shadow-slate-200 flex flex-col justify-between h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objectif du jour</span>
                            </div>
                            <h4 className="text-2xl font-black mb-2">
                                {dueCount >= 20 ? "Réduire le backlog" : dueCount > 0 ? "Consolider vos acquis" : "Explorer le savoir"}
                            </h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                {dueCount > 0 
                                    ? `Vous avez ${dueCount} items en attente. Une session optimisera votre rétention à long terme.`
                                    : "Votre mémoire est à jour. Pourquoi ne pas importer un nouveau document pour continuer l'expansion ?"}
                            </p>
                        </div>
                        <div className="mt-8 space-y-3 relative z-10">
                            <button 
                                onClick={onStartDailyReview}
                                disabled={dueCount === 0}
                                className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${dueCount > 0 ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                Réviser maintenant
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

    // Déterminisme des Insights
    const healthScore = Math.max(0, Math.min(100, 100 - dueCount * 2));
    const retentionStatus = mastery >= 70 ? "Stable" : mastery >= 40 ? "Modérée" : "Critique";
    const backlogSeverity = dueCount >= 30 ? "Risque Élevé" : dueCount >= 10 ? "Modéré" : "Sain";

    const insights = [
        {
            title: `Charge de révision : ${backlogSeverity}`,
            evidence: `Backlog de ${dueCount} items. ${dueCount > 20 ? "Risque élevé de décrochage cognitif." : "Charge de travail sous contrôle."}`,
            action: dueCount > 0 ? "Planifier une session de rattrapage" : "Encourager l'expansion",
            type: dueCount >= 20 ? 'risk' : 'info'
        },
        {
            title: `Rétention globale : ${retentionStatus}`,
            evidence: `Indice de maîtrise à ${mastery}%. ${mastery < 60 ? "Nécessite un renforcement des fondamentaux." : "Base de connaissance solide."}`,
            action: mastery < 70 ? "Activer le mode Remédiation" : "Passer en mode Socratique",
            type: mastery < 60 ? 'risk' : 'success'
        }
    ];

    const chartData = [
        { name: 'Dus', value: dueCount },
        { name: 'Concepts', value: totalNodes },
        { name: 'Maîtrisés', value: masteredNodes },
        { name: 'Items', value: totalItems }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Insights Réels */}
            <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4" /> Analyse prédictive du savoir
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.map((ins, i) => (
                        <div key={i} className={`p-8 rounded-[40px] border ${ins.type === 'risk' ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'} shadow-sm flex flex-col justify-between`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className={`font-black text-lg ${ins.type === 'risk' ? 'text-rose-900' : 'text-indigo-900'}`}>{ins.title}</h4>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${ins.type === 'risk' ? 'bg-rose-200 text-rose-700' : 'bg-indigo-200 text-indigo-700'}`}>
                                        {ins.type === 'risk' ? 'ALERTE' : 'CONSTAT'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8">
                                    {ins.evidence}
                                </p>
                            </div>
                            <button className={`w-full py-4 px-6 rounded-2xl font-black text-xs transition-all shadow-md ${ins.type === 'risk' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                {ins.action}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visualisation Metrics réelles */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-8">Metrics de l'Espace de Savoir</h3>
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

                {/* KPIs de Santé réels */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-8">Santé de l'Espace</h3>
                    <div className="space-y-6">
                        {[
                            { name: 'Maîtrise Globale', val: mastery, color: 'bg-indigo-500' },
                            { name: 'Concepts Validés', val: totalNodes > 0 ? (masteredNodes/totalNodes)*100 : 0, color: 'bg-emerald-500' },
                            { name: 'Score Santé Backlog', val: healthScore, color: healthScore < 50 ? 'bg-rose-500' : 'bg-amber-500' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    <span>{item.name}</span>
                                    <span className="text-slate-900">{Math.round(item.val)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
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
                            {props.role === UserRole.Manager ? "Dashboard Stratégique" : "Mon Hub de Maîtrise"}
                        </h1>
                        <p className="text-slate-400 font-medium mt-2">
                            {props.role === UserRole.Manager 
                                ? "Pilotage déterministe de la performance cognitive de l'espace."
                                : "Progression réelle calculée par l'IA sur vos documents importés."}
                        </p>
                    </div>
                    {props.streak && props.streak > 0 && (
                        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 animate-bounce-short">
                            <span className="text-2xl" aria-hidden="true">🔥</span>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Série actuelle</p>
                                <p className="text-lg font-black text-slate-900">{props.streak} Jours</p>
                            </div>
                        </div>
                    )}
                </header>

                {props.role === UserRole.Manager ? <ManagerDashboard {...props} /> : <CollaboratorDashboard {...props} />}
             </div>
             <style>{`
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-short {
                    animation: bounce-short 2s ease-in-out infinite;
                }
             `}</style>
        </div>
    );
};
