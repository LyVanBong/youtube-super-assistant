interface HistoryData {
    videoUrl: string;
    realTimestamp: string;
    commentContent?: string;
    summaryContent?: string;
    videoTimestamp?: string;
}

function saveToHistory(storageKey: 'commentHistory' | 'summaryHistory' | 'likeHistory', data: HistoryData): void {
    chrome.storage.local.get({ [storageKey]: [] }, (result) => {
        const history = result[storageKey];
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ [storageKey]: history });
    });
}

export function saveCommentToHistory(data: HistoryData): void {
    saveToHistory('commentHistory', data);
}

export function saveSummaryToHistory(data: HistoryData): void {
    saveToHistory('summaryHistory', data);
}

export function saveLikeToHistory(data: HistoryData): void {
    saveToHistory('likeHistory', data);
}

export function isVideoInCommentHistory(videoId: string, commentHistory: HistoryData[]): boolean {
    if (!videoId || !Array.isArray(commentHistory)) {
        return false;
    }
    return commentHistory.some(item => {
        try {
            const hasValidComment = item.commentContent?.trim() !== '';
            const itemVideoId = new URL(item.videoUrl).searchParams.get('v');
            return itemVideoId === videoId && hasValidComment;
        } catch (e) {
            return false;
        }
    });
}

export function isVideoInLikeHistory(videoId: string, likeHistory: HistoryData[]): boolean {
    if (!videoId || !Array.isArray(likeHistory)) {
        return false;
    }
    return likeHistory.some(item => {
        try {
            const itemVideoId = new URL(item.videoUrl).searchParams.get('v');
            return itemVideoId === videoId;
        } catch (e) {
            return false;
        }
    });
}