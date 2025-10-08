
import { BaseRequest, Settings, BaseBody } from './types';
import { handleCreateComment, handleCreateReply } from './handlers/commentHandler';
import { handleSummarizeVideo } from './handlers/summaryHandler';
import { handleGetTranscriptText, handleOpenTranscriptPage } from './handlers/transcriptHandler';
import { handleIsVideoInHistory, handleIsVideoLiked } from './handlers/historyHandler';
import { handleLikeVideo } from './handlers/likeHandler';
import { handleGetVideoInfo } from './handlers/videoInfoHandler';
import { handleOpenUpdateNotesPage, handleUserDismissedVersion } from './handlers/navigationHandler';

// The router maps action strings to handler functions.
const handlers: { [key: string]: (request: BaseRequest, settings: Settings) => Promise<any> } = {
    openUpdateNotesPage: () => handleOpenUpdateNotesPage(),
    userDismissedVersion: (request) => handleUserDismissedVersion(request.version!),
    createComment: (request, settings) => handleCreateComment(request.url!, request.timestamp, createBaseBody(request, settings)),
    createReply: (request, settings) => handleCreateReply(request.url!, request.parentComment, createBaseBody(request, settings)),
    summarizeVideo: (request, settings) => handleSummarizeVideo(request.url!, createBaseBody(request, settings)),
    getTranscriptText: (request, settings) => handleGetTranscriptText(request.url!, createBaseBody(request, settings)),
    openTranscriptPage: (request) => handleOpenTranscriptPage(request.videoUrl!),
    isVideoInHistory: (request) => handleIsVideoInHistory(request.videoId!),
    isVideoLiked: (request) => handleIsVideoLiked(request.videoId!),
    likeVideo: (request) => handleLikeVideo(request.url!),
    getVideoInfo: (request, settings) => handleGetVideoInfo(request.url!, createBaseBody(request, settings)),
};

function createBaseBody(request: BaseRequest, settings: Settings): BaseBody {
    return {
        url: request.url || '',
        language: settings.aiLanguage || 'English',
        prompt: settings.customPrompt || '',
        apiKey: settings.aiApiKey || ''
    };
}

export async function route(request: BaseRequest, sendResponse: (response?: any) => void): Promise<void> {
    const handler = handlers[request.action];
    if (!handler) {
        sendResponse({ success: false, error: `Unknown action: ${request.action}` });
        return;
    }

    try {
        // Settings are required for most handlers that call the API
        const settings = await chrome.storage.sync.get(['aiLanguage', 'customPrompt', 'aiApiKey']) as Settings;
        const result = await handler(request, settings);
        // Some handlers (like navigation) might not return anything.
        if (result) {
            sendResponse(result);
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        sendResponse({ success: false, error: errorMessage });
    }
}
