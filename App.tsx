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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Collaborator);
  const [activeGraph, setActiveGraph] = useState<KnowledgeGraph | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [mastery, setMastery] = useState<MasteryLayer>([]);
  const [currentSessionItems, setCurrentSessionItems] = useState<StudyItem[]>([]);
  
  // Gamification state
  const [level, setLevel] = useState(1);
  const [currentXp, setCurrentXp] = useState(0);
  const [xpForNextLevel, setXpForNextLevel] = useState(xpForLevel(1));

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  // Calcul de la maîtrise globale pour le Dashboard (Objectif 3)
  const { overallMastery } = useMemo(() => {
    if (mastery.length === 0) {
      return { overallMastery: 0, masteryCount: 0, masteredCount: 0 };
    }
    const sum = mastery.reduce((acc, m) => acc + m.confidence_score, 0);
    const avg = sum / mastery.length;
    const rounded = Math.round(avg);
    const clamped = Math.max(0, Math.min(100, rounded));
    
    // masteryCount et masteredCount calculés mais non passés au DashboardView (pas de props correspondantes)
    const masteryCount = mastery.length;
    const masteredCount = mastery.filter(m => m.confidence_score >= 70).length;

    return {
      overallMastery: clamped,
      masteryCount,
      masteredCount
    };
  }, [mastery]);

  // Persistence: LOAD MasteryLayer avec Normalisation
  useEffect(() => {
    if (!activeGraph) {
      setMastery([]);
      return;
    }

    const storageKey = `masteryLayer:${activeGraph.id}`;
    const storedData = localStorage.getItem(storageKey);
    let parsed: MasteryLayer | null = null;

    if (storedData) {
      try {
        parsed = JSON.parse(storedData);
      } catch (e) {
        console.error("Erreur fatale lors du parsing de la MasteryLayer:", e);
        localStorage.removeItem(storageKey);
      }
    }

    // Normalisation déterministe alignée sur les nœuds du graphe actif
    const normalizedMastery = normalizeMasteryLayer(activeGraph.nodes, parsed);
    setMastery(normalizedMastery);
  }, [activeGraph]);

  // Persistence: SAVE MasteryLayer
  useEffect(() => {
    if (!activeGraph || mastery.length === 0) return;
    
    const storageKey = `masteryLayer:${activeGraph.id}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(mastery));
    } catch (e) {
      console.error("Échec de persistance LocalStorage (MasteryLayer):", e);
    }
  }, [mastery, activeGraph]);

  // Persistence Gamification: LOAD
  useEffect(() => {
    if (!activeGraph) return;
    const key = `progress:${activeGraph.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const { level: l, currentXp: x } = JSON.parse(saved);
        const validatedLevel = Math.max(1, l || 1);
        const validatedXp = Math.max(0, x || 0);
        setLevel(validatedLevel);
        setCurrentXp(validatedXp);
        setXpForNextLevel(xpForLevel(validatedLevel));
      } catch (e) {
        console.error("Échec du chargement de la progression:", e);
      }
    } else {
      // Initialisation si aucune donnée
      setLevel(1);
      setCurrentXp(0);
      setXpForNextLevel(xpForLevel(1));
    }
  }, [activeGraph]);

  // Persistence Gamification: SAVE
  useEffect(() => {
    if (!activeGraph) return;
    const key = `progress:${activeGraph.id}`;
    try {
      localStorage.setItem(key, JSON.stringify({ level, currentXp }));
    } catch (e) {
      console.error("Échec de sauvegarde de la progression:", e);
    }
  }, [level, currentXp, activeGraph]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  };

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
    setAppState(AppState.Dashboard);
    showToast(`Connecté en tant que ${role}`);
  };

  const handleStartStudy = () => setAppState(AppState.Study);

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
      const directive = computeDirective(
        activeGraph, 
        mastery, 
        context, 
        signals.timeAvailable
      );

      setLoadingMessage(`Génération des items...`);
      const items = await generateStudyItems(activeGraph, directive);
      
      setCurrentSessionItems(items);
      showToast(`${items.length} items générés.`);
      setAppState(AppState.Study);
    } catch (e) {
      console.error(e);
      showToast("Erreur de préparation", "error");
      setAppState(AppState.Dashboard);
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

    // A) Récupération robuste du nodeId
    let nodeId = updatedItem.sourceNodeId;
    if (!nodeId) {
      if (!activeGraph) return; // Si activeGraph null -> ne rien faire.
      if (updatedItem.id.startsWith('ige-')) {
        const graphId = activeGraph.id;
        const prefix = `ige-${graphId}-`;
        if (updatedItem.id.startsWith(prefix)) {
          const remaining = updatedItem.id.substring(prefix.length);
          nodeId = remaining.split('-')[0];
        }
      }
    }

    const quality = updatedItem.lastQuality;

    // C) Vérification stricte des entrées
    if (!nodeId || typeof quality !== 'number') return;

    // Mise à jour de la maîtrise
    setMastery(prev => prev.map(m => {
      if (m.nodeId !== nodeId) return m;

      let confidenceAdj = 0;
      if (quality >= 4) confidenceAdj = 10;
      else if (quality <= 2) confidenceAdj = -10;
      
      const newConfidence = Math.max(0, Math.min(100, m.confidence_score + confidenceAdj));
      
      // B) Mise à jour stabilité avec lissage (0.7 / 0.3)
      const interval = updatedItem.sm2.interval || 0;
      const newStabilityCalculated = Math.max(0, Math.min(100, Math.round(Math.log2(interval + 1) * 20)));
      const smoothedStability = Math.round(0.7 * m.stability_index + 0.3 * newStabilityCalculated);

      return {
        ...m,
        confidence_score: newConfidence,
        stability_index: smoothedStability,
        last_interaction_at: new Date().toISOString()
      };
    }));

    // Gamification update
    const gained = awardXp(quality);
    if (gained > 0) {
      const nextProgression = applyXp(level, currentXp, gained);
      setLevel(nextProgression.level);
      setCurrentXp(nextProgression.currentXp);
      setXpForNextLevel(nextProgression.xpForNextLevel);
    }
  };

  const renderContent = () => {
    if (isLoading && appState !== AppState.Study) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-8 bg-slate-50 animate-fade-in">
          <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{loadingMessage || "Chargement..."}</h2>
          <p className="text-slate-400 font-medium">L'IA du projet travaille pour vous.</p>
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
          onStartDailyReview={handleStartStudy} 
          level={level} 
          currentXp={currentXp} 
          xpForNextLevel={xpForNextLevel} 
          mastery={overallMastery} 
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