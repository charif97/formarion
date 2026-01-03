import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppState, 
  UserRole, 
  KnowledgeGraph, 
  UserContext, 
  UserSignals, 
  MasteryLayer, 
  StudyItem,
  StudySet,
  ActivityEvent
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
import { computeWeakNodes, WeakNodeInsight } from './lib/weakNodes';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Collaborator);
  const [activeGraph, setActiveGraph] = useState<KnowledgeGraph | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [mastery, setMastery] = useState<MasteryLayer>([]);
  const [storedStudyItems, setStoredStudyItems] = useState<StudyItem[]>([]);
  const [currentSessionItems, setCurrentSessionItems] = useState<StudyItem[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);
  
  // Gamification state
  const [progress, setProgress] = useState({ 
    level: 1, 
    currentXp: 0, 
    xpForNextLevel: xpForLevel(1) 
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  // 1. Mappage des labels des nœuds
  const nodeLabels = useMemo(() => {
    const map: Record<string, string> = {};
    activeGraph?.nodes.forEach(node => {
      map[node.id] = node.label;
    });
    return map;
  }, [activeGraph]);

  // 2. Détection des nœuds faibles (Nouveauté 8.1)
  const weakNodes = useMemo(() => {
    return computeWeakNodes(mastery, activityLog, nodeLabels);
  }, [mastery, activityLog, nodeLabels]);

  // 3. Calcul des statistiques réelles et du Streak
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();
    
    const dueOnlyCount = storedStudyItems.filter(item => 
      item.nextReviewAt && new Date(item.nextReviewAt).getTime() <= nowTime
    ).length;

    const newCount = storedStudyItems.filter(item => !item.lastReviewedAt).length;
    const dueCount = dueOnlyCount + newCount;
    const totalItems = storedStudyItems.length;
    
    const masteredNodes = mastery.filter(m => m.confidence_score >= 70).length;
    const totalNodes = mastery.length;
    const sum = mastery.reduce((acc, m) => acc + m.confidence_score, 0);
    const avg = totalNodes > 0 ? sum / totalNodes : 0;
    const overallMastery = Math.max(0, Math.min(100, Math.round(avg)));

    const reviewDates = Array.from(new Set(
      storedStudyItems
        .filter(i => i.lastReviewedAt)
        .map(i => new Date(i.lastReviewedAt!).toLocaleDateString('fr-CA'))
    )).sort().reverse();
    
    let streakCount = 0;
    if (reviewDates.length > 0) {
      const todayStr = now.toLocaleDateString('fr-CA');
      const yesterday = new Date(nowTime - 86400000);
      const yesterdayStr = yesterday.toLocaleDateString('fr-CA');

      if (reviewDates[0] === todayStr || reviewDates[0] === yesterdayStr) {
        let checkDate = new Date(reviewDates[0]);
        for (const dateStr of reviewDates) {
          if (dateStr === checkDate.toLocaleDateString('fr-CA')) {
            streakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
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

  // 4. Aggrégation de l'historique sur 14 jours
  const history14 = useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateKey = d.toLocaleDateString('fr-CA');
      
      const daysEvents = activityLog.filter(e => 
        new Date(e.ts).toLocaleDateString('fr-CA') === dateKey
      );
      
      const studiedCount = daysEvents.length;
      const xpGained = daysEvents.reduce((acc, e) => acc + (e.gainedXp || 0), 0);
      const avgQuality = studiedCount > 0 
        ? Math.round((daysEvents.reduce((acc, e) => acc + (e.quality || 0), 0) / studiedCount) * 10) / 10
        : 0;
        
      result.push({
        date: dateKey,
        studiedCount,
        avgQuality,
        xpGained
      });
    }
    return result;
  }, [activityLog]);

  // 5. Moteur de prédictions IA (MVP)
  const predictions = useMemo(() => {
    const now = Date.now();
    const incomingDue48h = storedStudyItems.filter(item => {
      if (!item.nextReviewAt) return false;
      const t = new Date(item.nextReviewAt).getTime();
      return t > now && t <= now + (48 * 3600 * 1000);
    }).length;

    const last7Days = history14.slice(-7);
    const totalLast7 = last7Days.reduce((acc, d) => acc + d.studiedCount, 0);
    const dailyCapacity = Math.round(totalLast7 / 7);

    let backlogRisk: "Faible" | "Modéré" | "Élevé" = "Faible";
    if (dailyCapacity === 0) {
      backlogRisk = incomingDue48h > 0 ? "Modéré" : "Faible";
    } else {
      if (incomingDue48h > dailyCapacity * 2) backlogRisk = "Élevé";
      else if (incomingDue48h > dailyCapacity) backlogRisk = "Modéré";
    }

    const estDaysToClear = dailyCapacity > 0 
      ? Math.ceil(dashboardStats.dueCount / dailyCapacity) 
      : null;

    const hourCounts: Record<number, number> = {};
    activityLog.forEach(e => {
      const h = new Date(e.ts).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    let peakHour: number | null = null;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(h);
      }
    });

    return {
      dailyCapacity,
      backlogRisk,
      estDaysToClear,
      peakHour
    };
  }, [history14, storedStudyItems, dashboardStats.dueCount, activityLog]);

  // Load persistence logic
  useEffect(() => {
    if (!activeGraph) {
      setMastery([]);
      setStoredStudyItems([]);
      setActivityLog([]);
      setProgress({ level: 1, currentXp: 0, xpForNextLevel: xpForLevel(1) });
      return;
    }

    const gId = activeGraph.id;
    
    // Mastery
    const mData = localStorage.getItem(`masteryLayer:${gId}`);
    setMastery(normalizeMasteryLayer(activeGraph.nodes, mData ? JSON.parse(mData) : null));

    // Items
    const iData = localStorage.getItem(`studyItems:${gId}`);
    setStoredStudyItems(iData ? JSON.parse(iData) : []);

    // Activity Log
    const lData = localStorage.getItem(`activityLog:${gId}`);
    setActivityLog(lData ? JSON.parse(lData) : []);

    // Progress
    const pData = localStorage.getItem(`progress:${gId}`);
    if (pData) {
      const { level, currentXp } = JSON.parse(pData);
      setProgress({ level: level || 1, currentXp: currentXp || 0, xpForNextLevel: xpForLevel(level || 1) });
    }
  }, [activeGraph]);

  // Save changes to persistence
  useEffect(() => {
    if (!activeGraph) return;
    const gId = activeGraph.id;
    try {
      localStorage.setItem(`masteryLayer:${gId}`, JSON.stringify(mastery));
      localStorage.setItem(`studyItems:${gId}`, JSON.stringify(storedStudyItems));
      localStorage.setItem(`progress:${gId}`, JSON.stringify({ level: progress.level, currentXp: progress.currentXp }));
      localStorage.setItem(`activityLog:${gId}`, JSON.stringify(activityLog));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, [mastery, storedStudyItems, progress, activityLog, activeGraph]);

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
      setAppState(AppState.Import);
      return;
    }
    const queue = buildDailyReviewQueue(storedStudyItems, new Date(), 10);
    if (queue.length === 0) {
      showToast("Tous vos items sont à jour !", "success");
      return;
    }
    setCurrentSessionItems(queue);
    setAppState(AppState.Study);
  };

  /**
   * Lance une session focalisée sur les nœuds faibles (Nouveauté 8.1)
   */
  const handleStartWeakReview = () => {
    if (weakNodes.length === 0) {
      showToast("Aucun nœud faible détecté. Continuez votre progression !");
      return;
    }

    const weakNodeIds = weakNodes.map(w => w.nodeId);
    const filteredItems = storedStudyItems.filter(item => 
      item.sourceNodeId && weakNodeIds.includes(item.sourceNodeId)
    );

    if (filteredItems.length === 0) {
      showToast("Pas d'items alignés sur les nœuds faibles; lancez une session d'expansion.", "error");
      return;
    }

    // On utilise la même logique que buildDailyReviewQueue mais restreinte
    const queue = buildDailyReviewQueue(filteredItems, new Date(), 10);
    setCurrentSessionItems(queue);
    setAppState(AppState.Study);
    showToast(`Session de renforcement : ${queue.length} items prioritaires.`);
  };

  const handleCaeStart = async (signals: UserSignals) => {
    if (!activeGraph) return;
    setIsLoading(true);
    setLoadingMessage("Analyse du contexte...");
    try {
      const context = await calibrateSession(signals);
      setUserContext(context);
      const directive = computeDirective(activeGraph, mastery, context, signals.timeAvailable);
      const newItems = await generateStudyItems(activeGraph, directive);
      
      setStoredStudyItems(prev => {
        const merged = [...prev];
        newItems.forEach(ni => {
          const idx = merged.findIndex(m => m.id === ni.id);
          if (idx === -1 || !merged[idx].lastReviewedAt) {
            if (idx !== -1) merged[idx] = ni; else merged.push(ni);
          }
        });
        return merged;
      });
      setCurrentSessionItems(newItems);
      setAppState(AppState.Study);
    } catch (e) {
      showToast("Erreur de préparation", "error");
    } finally {
      setIsLoading(false);
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
    }
  };

  const handleUpdateItem = (updatedItem: StudyItem) => {
    setCurrentSessionItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setStoredStudyItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    const quality = updatedItem.lastQuality ?? 0;
    const gainedXp = awardXp(quality);

    // Logging activity
    if (activeGraph) {
      const event: ActivityEvent = {
        ts: new Date().toISOString(),
        type: 'review',
        quality,
        gainedXp,
        itemId: updatedItem.id,
        nodeId: updatedItem.sourceNodeId,
        mode: currentSessionItems.length > 10 ? 'Session' : 'DailyReview'
      };
      
      setActivityLog(prev => {
        const next = [...prev, event];
        const sixtyDaysAgo = Date.now() - (60 * 24 * 3600 * 1000);
        return next
          .filter(e => new Date(e.ts).getTime() > sixtyDaysAgo)
          .slice(-3000);
      });
    }

    // Update Mastery
    const nodeId = updatedItem.sourceNodeId;
    if (nodeId) {
      setMastery(prev => prev.map(m => {
        if (m.nodeId !== nodeId) return m;
        let confAdj = quality >= 4 ? 10 : (quality <= 2 ? -10 : 0);
        const newConf = Math.max(0, Math.min(100, m.confidence_score + confAdj));
        const newStabCalc = Math.max(0, Math.min(100, Math.round(Math.log2((updatedItem.sm2.interval || 0) + 1) * 20)));
        return {
          ...m,
          confidence_score: newConf,
          stability_index: Math.round(0.7 * m.stability_index + 0.3 * newStabCalc),
          last_interaction_at: new Date().toISOString()
        };
      }));
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
          onStartWeakReview={handleStartWeakReview}
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
          history14={history14}
          predictions={predictions}
          weakNodes={weakNodes}
          nodeLabels={nodeLabels}
        />
      );
      case AppState.Import: return <ImportView title="Import de Savoir" onGenerate={handleGenerateGraph} isLoading={isLoading} error={null} clearError={() => {}} />;
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