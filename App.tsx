import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Collaborator);
  const [activeGraph, setActiveGraph] = useState<KnowledgeGraph | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [mastery, setMastery] = useState<MasteryLayer>([]);
  const [currentSessionItems, setCurrentSessionItems] = useState<StudyItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (activeGraph && mastery.length === 0) {
      const initialMastery: MasteryLayer = activeGraph.nodes.map(node => ({
        nodeId: node.id,
        confidence_score: 0,
        stability_index: 0,
        last_interaction_at: null
      }));
      setMastery(initialMastery);
    }
  }, [activeGraph]);

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
          level={1} currentXp={0} xpForNextLevel={100} mastery={0} 
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