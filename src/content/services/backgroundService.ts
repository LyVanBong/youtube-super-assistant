
// A typed service for communicating with the background script.

interface Message {
    action: string;
    [key: string]: unknown;
}

function sendMessage<T>(message: Message): Promise<T> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
            }
            if (response && response.success) {
                return resolve(response as T);
            }
            reject(new Error(response ? response.error : 'An unknown error occurred.'));
        });
    });
}

// Define response types
interface CommentResponse { content: string; }
interface SummaryResponse { content: string; }
interface HistoryCheckResponse { isInHistory: boolean; }
interface LikedCheckResponse { isLiked: boolean; }
interface EmptySuccessResponse { success: boolean; }

export const backgroundService = {
    openTranscriptPage: (videoUrl: string): Promise<void> => 
        chrome.runtime.sendMessage({ action: 'openTranscriptPage', videoUrl }),

    createComment: (url: string, timestamp: string): Promise<CommentResponse> => 
        sendMessage({ action: 'createComment', url, timestamp }),

    createReply: (url: string, parentComment: string, timestamp: string): Promise<CommentResponse> =>
        sendMessage({ action: 'createReply', url, parentComment, timestamp }),

    summarizeVideo: (url: string): Promise<SummaryResponse> => 
        sendMessage({ action: 'summarizeVideo', url }),

    isVideoInHistory: (videoId: string): Promise<HistoryCheckResponse> => 
        sendMessage({ action: 'isVideoInHistory', videoId }),

    isVideoLiked: (videoId: string): Promise<LikedCheckResponse> => 
        sendMessage({ action: 'isVideoLiked', videoId }),

    likeVideo: (url: string): Promise<EmptySuccessResponse> => 
        sendMessage({ action: 'likeVideo', url }),

    getTimestamp: (): Promise<{ timestamp: string }> => 
        new Promise(resolve => chrome.runtime.sendMessage({ action: 'getTimestamp' }, resolve)),
    
    runCommentAutomation: (content: string): Promise<void> =>
        chrome.runtime.sendMessage({ action: 'commentNow', content }),

    openUpdateNotes: (): Promise<void> =>
        chrome.runtime.sendMessage({ action: "openUpdateNotesPage" }),

    dismissVersion: (version: string): Promise<void> =>
        chrome.runtime.sendMessage({ action: "userDismissedVersion", version: version })
};
