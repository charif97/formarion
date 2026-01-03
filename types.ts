export enum AppState {
  Landing,
  Login,
  Dashboard,
  Import,
  GeneratingGraph,
  GraphValidation,
  Study,
  Settings
}

export enum UserRole {
  Collaborator = 'Collaborateur',
  Manager = 'Manager',
  ContentOwner = 'Referent_Formation',
  Auditor = 'Auditeur_Compliance',
  BusinessAdmin = 'Admin_Business',
  TechAdmin = 'Admin_Tech'
}

/**
 * CONTRAT DE DONNÉE : Le Graphe de Savoir (CIE Output)
 */
export interface KnowledgeNode {
  id: string;
  label: string;
  description: string;
  content_atoms: string[];  // fragments de texte source
  prerequisites: string[];  // DAG des prérequis (IDs)
  difficulty_weight: number; // complexité (1-5)
}

export interface KnowledgeGraph {
  id: string;
  title: string;
  nodes: KnowledgeNode[];
  source_text: string;
  created_at: string;
}

/**
 * CONTRAT CAE : Signaux et Contexte
 */
export interface UserSignals {
  timeAvailable: number; // minutes
  energyLevel: 'low' | 'medium' | 'high';
  stressLevel: 'low' | 'medium' | 'high';
}

export interface UserContext {
  focusScore: number;  // 1-100 (Disponibilité cognitive calculée)
  sessionType: 'Sprint' | 'DeepWork' | 'Maintenance' | 'Recovery';
  stateDescription: string; // qualification factuelle de l'état
  signals?: UserSignals;
}

/**
 * CONTRAT POE : Maîtrise et Directives
 */
export interface MasteryState {
  nodeId: string;
  confidence_score: number; // 0-100
  stability_index: number; // 0-100 (rétention court vs long terme)
  last_interaction_at: string | null;
}

export type MasteryLayer = MasteryState[];

export interface PedagogicalDirective {
  mode: 'Review' | 'Expansion' | 'Remediation' | 'Socratic';
  targetNodeIds: string[];
  intensity: number; // 1-5
  maxItems: number;
  rationale: string; // Explication stratégique de la directive
}

export interface NormalizedDocument {
  text: string;
  title: string;
  language: string;
}

/**
 * SRS & STUDY ITEMS
 */
export interface Sm2State {
  interval: number;
  repetitions: number;
  efactor: number;
}

export interface StudyItem {
  id: string;
  type: 'flashcard' | 'mcq' | 'free' | 'case' | 'true/false';
  question: string;
  explanation?: string;
  difficulty: number;
  sm2: Sm2State;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  tags?: string[];
  answer?: string;
  options?: string[]; // Spécifique MCQ
  correctAnswerIndex?: number; // Spécifique MCQ
  correctAnswer?: boolean; // Spécifique True/False
  lastQuality?: number; // MVP: Stocke la dernière note pour mise à jour Mastery
  
  // Provenance & Alignement Graphe
  sourceNodeId?: string;
  sourceAtoms?: string[];
  atomCoverage?: number;
}

/**
 * ACTIVITÉ & ANALYTICS
 */
export type ActivityEvent = {
  ts: string;                 // ISO
  type: 'review';
  itemId: string;
  nodeId?: string;
  quality?: number;
  mode?: 'DailyReview' | 'Session';
  gainedXp?: number;
};

/**
 * IGE (Item Generation Engine) Metadata
 */
export interface GeneratedStudyItem extends StudyItem {
  sourceNodeId: string;
  sourceAtoms: string[];
  atomCoverage: number; // 0-1 : proportion d’atomes utilisés dans l'item
}

export interface MCQ extends StudyItem {
  type: 'mcq';
  options: string[];
  correctAnswerIndex: number;
}

export interface TrueFalse extends StudyItem {
  type: 'true/false';
  correctAnswer: boolean;
}

export interface Flashcard extends StudyItem {
  type: 'flashcard';
  answer: string;
}

export interface StudySet {
  id: string;
  title: string;
  items: StudyItem[];
  createdAt: string;
  sourceText?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  mastery: number;
  level: number;
  xp: number;
  streak: number;
  totalCardsStudied: number;
  avatarSeed?: string;
  history?: { date: string; mastery: number; xp: number }[];
}

export interface Class {
  id: string;
  name: string;
  studySets: StudySet[];
  students: StudentProfile[];
  activity: {
    date: string;
    cardsStudied: number;
    activeStudents: number;
    avgMastery: number;
  }[];
}