
import React, { useState, useMemo } from 'react';
import { UserRole, Class, StudySet } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { CheckIcon, BellIcon, UserGroupIcon, LightBulbIcon, ClockIcon, BookOpenIcon, ChevronDownIcon } from './icons';

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
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; color?: string; icon?: React.ReactNode }> = ({ title, value, subtext, color = "text-slate-800", icon }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div>
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                {icon && <div className="text-slate-300">{icon}</div>}
            </div>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
    </div>
);

// --- 1. COLLABORATOR VIEW: KNOWLEDGE MAP FOCUS ---
const CollaboratorDashboard: React.FC<DashboardProps> = ({ onStartDailyReview, level, currentXp, xpForNextLevel, mastery }) => {
    const masteryData = [
        { subject: 'Conformité', mastery: 85 },
        { subject: 'Crédit', mastery: 45 },
        { subject: 'Soft Skills', mastery: 90 },
        { subject: 'Process', mastery: 65 },
        { subject: 'Risques', mastery: 30 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Knowledge Graph Card */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Graphe de Maîtrise</h3>
                            <p className="text-sm text-slate-400 font-medium">Visualisation de vos compétences acquises</p>
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

                {/* Next Step / Context Prompt */}
                <div className="flex flex-col gap-6">
                    <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col justify-between flex-grow">
                        <div>
                            <h4 className="text-2xl font-black mb-2">Prêt pour l'étape suivante ?</h4>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                                L'IA a préparé une session de révision de 8 minutes sur la Conformité LCB-FT.
                            </p>
                        </div>
                        <button 
                            onClick={onStartDailyReview}
                            className="mt-8 bg-white text-indigo-600 font-black py-4 px-6 rounded-2xl hover:bg-indigo-50 transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            Démarrer la session
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Progression XP</p>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard title="Maîtrise Globale" value={`${mastery}%`} color="text-emerald-600" />
                <StatCard title="Série Actuelle" value="12 Jours" color="text-amber-500" icon="🔥" />
                <StatCard title="Certifications" value="3" color="text-indigo-600" />
                <StatCard title="Temps d'étude" value="14h" subtext="Ce mois-ci" />
            </div>
        </div>
    );
};

// --- 2. MANAGER VIEW: DECISION SUPPORT FOCUS ---
const ManagerDashboard: React.FC<DashboardProps> = ({ classes }) => {
    const decisions = [
        {
            id: 1,
            title: "Renforcement LCB-FT",
            evidence: "30% de l'équipe Rabat Agdal stagne sur le concept 'Bénéficiaire Effectif'.",
            action: "Assigner le module de remédiation (Scaffolding)",
            type: "risk",
            count: 4
        },
        {
            id: 2,
            title: "Opportunité Soft Skills",
            evidence: "Sarah L. a validé 100% du socle théorique avec un score excellent.",
            action: "Valider le passage en mode Socratique / Approfondissement",
            type: "opportunity",
            count: 1
        }
    ];

    const teamPerf = [
        { name: 'Rabat Agdal', mastery: 72 },
        { name: 'Casablanca Anfa', mastery: 85 },
        { name: 'Tanger Centre', mastery: 64 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Decision Flux */}
            <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4" /> Flux de décisions proactif
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {decisions.map(d => (
                        <div key={d.id} className={`p-6 rounded-3xl border ${d.type === 'risk' ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'} shadow-sm flex flex-col justify-between`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className={`font-black text-lg ${d.type === 'risk' ? 'text-rose-900' : 'text-indigo-900'}`}>{d.title}</h4>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${d.type === 'risk' ? 'bg-rose-200 text-rose-700' : 'bg-indigo-200 text-indigo-700'}`}>
                                        {d.type === 'risk' ? 'ALERTE RISQUE' : 'OPPORTUNITÉ'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                                    <span className="font-bold opacity-50 block mb-1">PREUVE IA :</span>
                                    {d.evidence}
                                </p>
                            </div>
                            <button className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-md transform hover:scale-[1.01] ${d.type === 'risk' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                {d.action} ({d.count} pers.)
                            </button>
                        </div>
                    ))}
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
                            { name: 'Code Éthique', val: 100, status: 'OK' },
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
