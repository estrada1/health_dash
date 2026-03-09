export interface ErrorResponse {
  error: string;
}

export interface WeightEntry {
  timestamp: string;
  weight: number;
}

export type WorkoutType = 'Running' | 'Weights' | 'Swim' | 'Yoga';

export interface WorkoutEntry {
  timestamp: string;
  workout_type: WorkoutType;
  note: string;
}

export interface MealEntry {
  timestamp: string;
  title: string;
  calories: number | null;
  notes: string;
}

export interface JournalEntry {
  filename: string;
  timestamp: string;
  html: string;
}

export interface JournalEntryWithContent extends JournalEntry {
  content: string;
}
