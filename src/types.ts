export type PracticeMode = 'free' | 'goal' | 'listen' | 'review';
export type AppView = 'home' | 'practice' | 'progress' | 'parent';
export type CardType = 'initial' | 'final' | 'tone';
export type Difficulty = 'easy' | 'standard';
export type SlotKey = 'initial' | 'final' | 'tone';

export interface CardItem {
  id: string;
  type: CardType;
  text: string;
  displayText: string;
  colorType: SlotKey;
  difficultyTag: Difficulty;
}

export interface SyllableRecord {
  id: string;
  initial: string;
  final: string;
  tone: string;
  syllable: string;
  displaySyllable: string;
  word: string;
  emoji: string;
  hint: string;
  audioUrl: string;
  difficulty: Difficulty;
  stageId: string;
  tags: string[];
}

export interface StageDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  difficulty: Difficulty;
  syllableIds: string[];
}

export interface PracticeQuestion {
  id: string;
  mode: Exclude<PracticeMode, 'free'>;
  targetSyllable: SyllableRecord;
}

export interface PracticeSlots {
  initial: string | null;
  final: string | null;
  tone: string | null;
}

export interface Metrics {
  attempts: number;
  successCount: number;
  errorCount: number;
  streak: number;
  bestStreak: number;
  completedChallenges: number;
  todayCount: number;
  lastPlayedDate: string;
  recentSuccesses: string[];
  masteredSyllables: string[];
  wrongSyllables: Record<string, number>;
}

export interface ParentSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  reminderMinutes: number;
  difficulty: Difficulty;
}

export interface EvaluationResult {
  status: 'idle' | 'success' | 'error';
  message: string;
  match?: SyllableRecord;
}
