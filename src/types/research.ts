// Deep research types

export interface ResearchConfig {
    maxIterations: number;
    maxSearchesPerIteration: number;
    minSources: number;
    topic: string;
}

export type ResearchPhase =
    | 'idle'
    | 'planning'
    | 'searching'
    | 'analyzing'
    | 'synthesizing'
    | 'critiquing'
    | 'complete'
    | 'failed';

export interface ResearchProgress {
    phase: ResearchPhase;
    iteration: number;
    maxIterations: number;
    currentQuery?: string;
    sourcesFound: number;
    findings: string[];
    percentComplete: number;
}

export interface ResearchSession {
    id: string;
    userId: string;
    conversationId: string;
    topic: string;
    status: ResearchPhase;
    config: ResearchConfig;
    progress: ResearchProgress;
    queries: string[];
    sources: ResearchSource[];
    findings: string[];
    finalReport?: string;
    createdAt: Date;
    completedAt?: Date;
    error?: string;
}

export interface ResearchSource {
    url: string;
    title: string;
    content: string;
    score: number;
    publishedDate?: string;
    iteration: number;
    query: string;
}

export interface ResearchFinding {
    content: string;
    sources: string[];
    confidence: number;
    iteration: number;
}
