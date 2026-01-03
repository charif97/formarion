import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppState, 
  UserRole, 
  KnowledgeGraph, 
  UserContext, 
  UserSignals, 
  MasteryLayer, 
  StudyItem,
  StudySet
} from './types';
import { DashboardView } from './components/DashboardView';
import { ImportView } from './components/ImportView';
import { GraphValidationView } from './components/GraphValidationView';
import { LandingView } from './components/LandingView';
import { LoginView } from './components/LoginView';
import { ContextGateway } from './components/ContextGateway';
import { StudyView } from './components/StudyView';
import { Toast } from './components/Toast';
import { generateKnowledgeGraph } from './services/geminiService';
import { calibrateSession } from './services/caeService';
import { computeDirective } from './services/poeService';
import { generateStudyItems } from './services/igeService';
import { normalizeMasteryLayer } from './lib/mastery';
import { xpForLevel, awardXp, applyXp } from './lib/xp';
import { buildDailyReviewQueue } from './lib/review';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Collaborator);
  const [activeGraph, setActiveGraph] = useState<KnowledgeGraph | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [mastery, setMastery] = useState<MasteryLayer>([]);
  const [storedStudyItems, setStoredStudyItems] = useState<StudyItem[]>([]);
  const [currentSessionItems, setCurrentSessionItems] = useState<StudyItem[]>([]);
  
  // Gamification state
  const [progress, setProgress] = useState({ 
    level: 1, 
    currentXp: 0, 
    xpForNextLevel: xpForLevel(1) 
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  // Mappage des labels des nœuds pour le Dashboard
  const nodeLabels = useMemo(() => {
    const map: Record<string, string> = {};
    activeGraph?.nodes.forEach(node => {
      map[node.id] = node.label;
    });
    return map;
  }, [activeGraph]);

  // Calcul des statistiques réelles pour le Dashboard
  const dashboardStats = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Items dus
    const dueOnlyCount = storedStudyItems.filter(item => 
      item.nextReviewAt && new Date(item.nextReviewAt).getTime() <= now
    ).length;

    // Nouveaux items
    const newCount = storedStudyItems.filter(item => !item.lastReviewedAt).length;

    // File de révision totale
    const dueCount = dueOnlyCount + newCount;
    const totalItems = storedStudyItems.length;
    
    // Maîtrise
    const masteredNodes = mastery.filter(m => m.confidence_score >= 70).length;
    const totalNodes = mastery.length;
    const sum = mastery.reduce((acc, m) => acc + m.confidence_score, 0);
    const avg = totalNodes > 0 ? sum / totalNodes : 0;
    const overallMastery = Math.max(0, Math.min(100, Math.round(avg)));

    // Calcul de la série (Streak)
    const reviewDates = new Set(
      storedStudyItems
        .filter(i => i.lastReviewedAt)
        .map(i => new Date(i.lastReviewedAt!).toISOString().split('T')[0])
    );
    
    let streakCount = 0;
    if (reviewDates.size > 0) {
      const checkDate = new Date();
      // Si pas de révision aujourd'hui, on vérifie à partir d'hier
      if (!reviewDates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      while (reviewDates.has(checkDate.toISOString().split('T')[0])) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    return { 
      dueCount, 
      dueOnlyCount,
      newCount, 
      totalItems, 
      masteredNodes, 
      totalNodes,
      overallMastery,
      streak: streakCount
    };
  }, [storedStudyItems, mastery]);

  // Persistence Mastery: LOAD
  useEffect(() => {
    if (!activeGraph) {
      setMastery([]);
      return;
    }
    const storageKey = `masteryLayer:${activeGraph.id}`;
    const storedData = localStorage.getItem(storageKey);
    let parsed: MasteryLayer | null = null;
    if (storedData) {
      try { parsed = JSON.parse(storedData); } catch (e) { localStorage.removeItem(storageKey); }
    }
    setMastery(normalizeMasteryLayer(activeGraph.nodes, parsed));
  }, [activeGraph]);

  // Persistence Mastery: SAVE
  useEffect(() => {
    if (!activeGraph || mastery.length === 0) return;
    try {
      localStorage.setItem(`masteryLayer:${activeGraph.id}`, JSON.stringify(mastery));
    } catch (e) {
      console.error("Quota exceeded or localStorage disabled: Mastery Layer not saved.", e);
    }
  }, [mastery, activeGraph]);

  // Persistence StudyItems: LOAD
  useEffect(() => {
    if (!activeGraph) {
      setStoredStudyItems([]);
      return;
    }
    const storageKey = `studyItems:${activeGraph.id}`;
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        setStoredStudyItems(JSON.parse(storedData));
      } catch (e) {
        localStorage.removeItem(storageKey);
        setStoredStudyItems([]);
      }
    } else {
      setStoredStudyItems([]);
    }
  }, [activeGraph]);

  // Persistence StudyItems: SAVE
  useEffect(() => {
    if (!activeGraph) return;
    try {
      localStorage.setItem(`studyItems:${activeGraph.id}`, JSON.stringify(storedStudyItems));
    } catch (e) {
      console.error("Quota exceeded or localStorage disabled: Study Items not saved.", e);
    }
  }, [storedStudyItems, activeGraph]);

  // Persistence Gamification: LOAD
  useEffect(() => {
    if (!activeGraph) {
      setProgress({ level: 1, currentXp: 0, xpForNextLevel: xpForLevel(1) });
      return;
    }
    const storageKey = `progress:${activeGraph.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const { level: l, currentXp: x } = JSON.parse(saved);
        const vL = Math.max(1, l || 1);
        const vX = Math.max(0, x || 0);
        setProgress({ level: vL, currentXp: vX, xpForNextLevel: xpForLevel(vL) });
      } catch (e) {
        localStorage.removeItem(storageKey);
        setProgress({ level: 1, currentXp: 0, xpForNextLevel: xpForLevel(1) });
      }
    } else {
      setProgress({ level: 1, currentXp: 0, xpForNextLevel: xpForLevel(1) });
    }
  }, [activeGraph]);

  // Persistence Gamification: SAVE
  useEffect(() => {
    if (!activeGraph) return;
    try {
      localStorage.setItem(`progress:${activeGraph.id}`, JSON.stringify({ 
        level: progress.level, 
        currentXp: progress.currentXp 
      }));
    } catch (e) {
      console.error("Quota exceeded or localStorage disabled: Progress not saved.", e);
    }
  }, [progress.level, progress.currentXp, activeGraph]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  };

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
    setAppState(AppState.Dashboard);
    showToast(`Connecté en tant que ${role}`);
  };

  const handleStartDailyReview = () => {
    if (!activeGraph) {
      showToast("Veuillez d'abord importer un document", "error");
      setAppState(AppState.Import);
      return;
    }

    if (storedStudyItems.length === 0) {
      showToast("Pas encore d'items à réviser. Lancez une première session personnalisée.", "error");
      return;
    }

    const queue = buildDailyReviewQueue(storedStudyItems, new Date(), 10);
    if (queue.length === 0) {
      showToast("Tous vos items sont à jour ! Revenez plus tard ou lancez une session d'expansion.", "success");
      return;
    }

    setCurrentSessionItems(queue);
    setAppState(AppState.Study);
  };

  const handleCaeStart = async (signals: UserSignals) => {
    if (!activeGraph) {
      showToast("Veuillez d'abord importer un document", "error");
      setAppState(AppState.Import);
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Analyse du contexte...");
    try {
      const context = await calibrateSession(signals);
      setUserContext(context);
      
      setLoadingMessage("Calcul de la stratégie...");
      const directive = computeDirective(activeGraph, mastery, context, signals.timeAvailable);

      setLoadingMessage(`Génération des items...`);
      const newItems = await generateStudyItems(activeGraph, directive);
      
      setStoredStudyItems(prev => {
        const merged = [...prev];
        newItems.forEach(ni => {
          const idx = merged.findIndex(m => m.id === ni.id);
          if (idx !== -1) {
            if (!merged[idx].lastReviewedAt) {
              merged[idx] = ni;
            }
          } else {
            merged.push(ni);
          }
        });
        return merged;
      });

      setCurrentSessionItems(newItems);
      showToast(`${newItems.length} items préparés.`);
      setAppState(AppState.Study);
    } catch (e) {
      console.error(e);
      showToast("Erreur de préparation", "error");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleGenerateGraph = async (text: string, title: string) => {
    setIsLoading(true);
    setLoadingMessage("Création du graphe de savoir...");
    setAppState(AppState.GeneratingGraph);
    try {
      const graph = await generateKnowledgeGraph(text, title);
      setActiveGraph(graph);
      setAppState(AppState.GraphValidation);
    } catch (e) {
      showToast("Erreur de génération", "error");
      setAppState(AppState.Import);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleUpdateItem = (updatedItem: StudyItem) => {
    setCurrentSessionItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    setStoredStudyItems(prev => {
      const idx = prev.findIndex(item => item.id === updatedItem.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updatedItem;
        return next;
      }
      return [...prev, updatedItem];
    });

    let nodeId = updatedItem.sourceNodeId;
    if (!nodeId && activeGraph) {
      if (updatedItem.id.startsWith('ige-')) {
        const prefix = `ige-${activeGraph.id}-`;
        if (updatedItem.id.startsWith(prefix)) {
          nodeId = updatedItem.id.substring(prefix.length).split('-')[0];
        }
      }
    }

    const quality = updatedItem.lastQuality;
    if (nodeId && typeof quality === 'number') {
      setMastery(prev => prev.map(m => {
        if (m.nodeId !== nodeId) return m;
        let confAdj = quality >= 4 ? 10 : (quality <= 2 ? -10 : 0);
        const newConf = Math.max(0, Math.min(100, m.confidence_score + confAdj));
        const interval = updatedItem.sm2.interval || 0;
        const newStabCalc = Math.max(0, Math.min(100, Math.round(Math.log2(interval + 1) * 20)));
        const smoothedStab = Math.round(0.7 * m.stability_index + 0.3 * newStabCalc);
        return {
          ...m,
          confidence_score: newConf,
          stability_index: smoothedStab,
          last_interaction_at: new Date().toISOString()
        };
      }));

      const gainedXp = awardXp(quality);
      if (gainedXp > 0) {
        setProgress(prev => applyXp(prev.level, prev.currentXp, gainedXp));
      }
    }
  };

  const renderContent = () => {
    if (isLoading && appState !== AppState.Study) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-8 bg-slate-50 animate-fade-in">
          <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{loadingMessage || "Chargement..."}</h2>
          <p className="text-slate-400 font-medium">L'intelligence artificielle prépare vos ressources.</p>
        </div>
      );
    }

    switch (appState) {
      case AppState.Landing: return <LandingView onGetStarted={() => setAppState(AppState.Login)} />;
      case AppState.Login: return <LoginView onLogin={handleLogin} onBack={() => setAppState(AppState.Landing)} />;
      case AppState.Dashboard: return (
        <DashboardView 
          role={currentRole} 
          classes={[]} 
          onNewSet={() => setAppState(AppState.Import)} 
          onStartStudySet={() => {}} 
          onStartDailyReview={handleStartDailyReview} 
          level={progress.level} 
          currentXp={progress.currentXp} 
          xpForNextLevel={progress.xpForNextLevel} 
          mastery={dashboardStats.overallMastery}
          dueCount={dashboardStats.dueCount}
          dueOnlyCount={dashboardStats.dueOnlyCount}
          newCount={dashboardStats.newCount}
          totalItems={dashboardStats.totalItems}
          masteredNodes={dashboardStats.masteredNodes}
          totalNodes={dashboardStats.totalNodes}
          streak={dashboardStats.streak}
          masteryLayer={mastery}
          nodeLabels={nodeLabels}
        />
      );
      case AppState.Import: return <ImportView title="Ingestion de Savoir" onGenerate={handleGenerateGraph} isLoading={isLoading} error={null} clearError={() => {}} />;
      case AppState.GraphValidation: return activeGraph ? <GraphValidationView graph={activeGraph} onConfirm={() => setAppState(AppState.Dashboard)} onCancel={() => setAppState(AppState.Import)} /> : null;
      case AppState.Study: 
        if (currentSessionItems.length > 0) {
          const mockSet: StudySet = {
            id: 'session-live',
            title: activeGraph?.title || 'Session Active',
            items: currentSessionItems,
            createdAt: new Date().toISOString(),
            sourceText: activeGraph?.source_text
          };
          return (
            <StudyView 
              studySet={mockSet} 
              studyQueue={currentSessionItems} 
              onUpdateItem={handleUpdateItem}
              onFinish={() => setAppState(AppState.Dashboard)}
            />
          );
        }
        return <ContextGateway onStart={handleCaeStart} onCancel={() => setAppState(AppState.Dashboard)} />;
      default: return <LandingView onGetStarted={() => setAppState(AppState.Login)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {renderContent()}
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
};

export default App;
