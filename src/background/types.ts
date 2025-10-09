
export interface BaseRequest {
    action: string;
    url?: string;
    videoUrl?: string;
    videoId?: string;
    version?: string;
    timestamp?: string;
    parentComment?: string;
}

export type Settings = {
    aiLanguage: string;
    customPrompt: string;
    aiApiKey: string;
};

export interface BaseBody {
    url: string;
    language: string;
    prompt: string;
    apiKey: string;
    [key: string]: unknown;
}
