
export interface StoryboardScene {
  caption: string;
  visual_prompt: string;
  imageUrl?: string; // Added after generation
  videoUrl?: string; // Added for user-uploaded video replacement
  isLoadingImage?: boolean;
  isRegenerating?: boolean; // Loading state for regeneration
  isUserUploaded?: boolean; // Track if the user manually provided the image
  timestamp?: number; // Estimated start time in seconds
}

export interface QuizQuestion {
  question: string;
  answer: string;
}

export interface LessonPlan {
  topic: string;
  target_audience: string;
  learning_objectives: string[];
  anatomical_structures: string[];
  clinical_correlation: string;
  technique_tips: string;
  quiz: QuizQuestion[];
  community_discussion: string;
}

export interface AnalysisResult {
  transcript: string;
  title: string;
  description: string;
  keywords: string[];
  lesson: LessonPlan;
  storyboard: StoryboardScene[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING', // Transcribing and extracting metadata
  GENERATING_IMAGES = 'GENERATING_IMAGES', // Generating storyboard images
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}