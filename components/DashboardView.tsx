import React from 'react';
import { UserRole, Class, StudySet, MasteryLayer } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { CheckIcon, LightBulbIcon, ClockIcon, BookOpenIcon } from './icons';
import { WeakNodeInsight } from '../lib/weakNodes';

interface DashboardProps {
  classes: Class[];
  onNewSet: () => void;
  onStartStudySet: (set: StudySet) => void;
  onStartDailyReview: () => void;
  onStartWeakReview: () => void;
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  mastery: number;
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
  history14: { date: string; studiedCount: number; avgQuality: number; xpGained: number }[];
  predictions: { 
    dailyCapacity: number; 
    backlogRisk: "Faible" | "Modéré" | "Élevé"; 
    estDaysToClear: number | null; 
    peakHour: number | null 
  };
  weakNodes: WeakNodeInsight[];
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

const CollaboratorDashboard: React.FC<DashboardProps> = (props) => {
    const { 
        onStartDailyReview, onStartWeakReview, level, currentXp, xpForNextLevel, mastery, 
        dueCount, dueOnlyCount, newCount, totalItems, masteredNodes, totalNodes, 
        streak, onNewSet, history14, predictions, weakNodes
    } = props;

    const hasActivity = history14.some(d => d.studiedCount > 0);

    if (totalNodes === 0 && totalItems === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center animate-fade-in">
                <div className="p-6 bg-slate-50 rounded-full mb-6">
                    <BookOpenIcon className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Votre jungle est vide</h3>
                <p className="text-slate-400 font-medium max-w-sm mb-8">Importez votre premier document pour que l'IA puisse générer votre parcours.</p>
                <button onClick={onNewSet} className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <AddIcon className="w-5 h-5" /> Importer du contenu
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
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
                    subtext="Activité consécutive" 
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Activité (14j)</h3>
                            <p className="text-sm text-slate-400 font-medium">Nombre d'items étudiés quotidiennement</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Niveau</span>
                            <span className="text-2xl font-black text-indigo-600">{level}</span>
                        </div>
                    </div>
                    
                    {hasActivity ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history14}>
                                    <defs>
                                        <linearGradient id="colorStudied" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10}}
                                        tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                                    />
                                    <YAxis hide domain={[0, 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="studiedCount" 
                                        stroke="#6366f1" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorStudied)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Aucune activité enregistrée sur les 14 derniers jours.</p>
                            <button onClick={onStartDailyReview} className="mt-4 text-indigo-600 font-black text-sm hover:underline">Commencer maintenant</button>
                        </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg">{level}</div>
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

                <div className="flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex-grow">
                        <div className="flex items-center gap-2 mb-6">
                            <LightBulbIcon className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-black text-slate-800">Prédictions IA</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risque Backlog (48h)</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${predictions.backlogRisk === 'Élevé' ? 'bg-rose-500' : predictions.backlogRisk === 'Modéré' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                    <p className="font-black text-slate-800">{predictions.backlogRisk}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maintien des acquis</p>
                                <p className="font-black text-slate-800">
                                    {predictions.estDaysToClear ? `${predictions.estDaysToClear} jour(s)` : "Calibrage requis"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">Pour vider le backlog actuel</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fenêtre optimale</p>
                                <p className="font-black text-slate-800">
                                    {predictions.peakHour !== null ? `Vers ${predictions.peakHour}h00` : "Non déterminée"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">Basé sur votre historique</p>
                            </div>
                        </div>

                        <button 
                            onClick={dueCount > 0 ? onStartDailyReview : onNewSet}
                            className="w-full mt-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                        >
                            {dueCount > 0 ? "Gérer le Backlog" : "Nouvel Import"}
                        </button>
                    </div>
                </div>
            </div>

            {weakNodes.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-rose-600 p-8 rounded-[40px] text-white shadow-xl shadow-rose-200 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">Alerte Rétention</span>
                            </div>
                            <h4 className="text-2xl font-black mb-2">Renforcement IA</h4>
                            <p className="text-rose-100 text-sm font-medium leading-relaxed">
                                {weakNodes.length} concepts présentent des signes de fragilité cognitive. Une session de rappel focalisée est recommandée.
                            </p>
                        </div>
                        <button 
                            onClick={onStartWeakReview}
                            className="mt-8 py-4 bg-white text-rose-600 font-black rounded-2xl shadow-lg hover:bg-rose-50 transition-all transform hover:scale-[1.02]"
                        >
                            Renforcer maintenant
                        </button>
                    </div>

                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-slate-800 mb-6">Points de vigilance</h3>
                        <div className="space-y-4">
                            {weakNodes.map((node) => (
                                <div key={node.nodeId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-rose-200 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors truncate max-w-[200px]">{node.label}</p>
                                            {node.priority > 60 && (
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black rounded uppercase tracking-widest">Critique</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cause : {node.reason}</p>
                                    </div>
                                    <div className="flex gap-4 text-right">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase">Maîtrise</p>
                                            <p className={`font-black text-sm ${node.confidence < 40 ? 'text-rose-500' : 'text-amber-500'}`}>{node.confidence}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase">Stabilité</p>
                                            <p className="font-black text-sm text-slate-700">{node.stability}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ManagerDashboard: React.FC<DashboardProps> = (props) => {
    const { mastery, dueCount, totalItems, masteredNodes, totalNodes } = props;

    const healthScore = Math.max(0, Math.min(100, 100 - dueCount * 2));
    const retentionStatus = mastery >= 70 ? "Stable" : mastery >= 40 ? "Modérée" : "Critique";
    const backlogSeverity = dueCount >= 30 ? "Risque Élevé" : dueCount >= 10 ? "Modéré" : "Sain";

    const insights = [
        {
            title: `Charge de révision : ${backlogSeverity}`,
            evidence: `Backlog de ${dueCount} items. ${dueCount > 20 ? "Risque de décrochage identifié." : "Charge sous contrôle."}`,
            action: dueCount > 0 ? "Planifier session de rappel" : "Encourager expansion",
            type: dueCount >= 20 ? 'risk' : 'info'
        },
        {
            title: `Rétention globale : ${retentionStatus}`,
            evidence: `Indice de maîtrise à ${mastery}%. ${mastery < 60 ? "Renforcement requis." : "Base solide."}`,
            action: mastery < 70 ? "Activer Remédiation" : "Mode Socratique",
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
                                        {ins.type === 'risk' ? 'ALERTE' : 'CONSTAT'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8">{ins.evidence}</p>
                            </div>
                            <button className={`w-full py-4 px-6 rounded-2xl font-black text-xs transition-all shadow-md ${ins.type === 'risk' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                {ins.action}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 mb-8">Metrics de l'Espace</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={0.1} fill="#6366f1" />
                            </AreaChart>
                         </ResponsiveContainer>
                    </div>
                </div>

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
                        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <span className="text-2xl" aria-hidden="true">🔥</span>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Série</p>
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
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);