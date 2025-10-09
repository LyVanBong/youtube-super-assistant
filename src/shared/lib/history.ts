interface HistoryData {
    videoUrl: string;
    realTimestamp: string;
    commentContent?: string;
    summaryContent?: string;
    videoTimestamp?: string;
    title?: string; // Add title to be stored with history
}

type StatKey = 'comments' | 'summaries' | 'likes' | 'transcripts';
type StorageKey = 'commentHistory' | 'summaryHistory' | 'likeHistory' | 'transcriptHistory';

function incrementStat(statKey: StatKey): void {
    chrome.storage.local.get({ stats: { comments: 0, summaries: 0, likes: 0, transcripts: 0 } }, (result) => {
        const newStats = result.stats;
        if (Object.prototype.hasOwnProperty.call(newStats, statKey)) {
            newStats[statKey]++;
        }
        chrome.storage.local.set({ stats: newStats });
    });
}

function saveToHistory(storageKey: StorageKey, data: HistoryData): void {
    chrome.storage.local.get({ [storageKey]: [] }, (result) => {
        const history = result[storageKey];
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ [storageKey]: history });
    });

    // Increment stats based on the history type
    const statMap: Record<StorageKey, StatKey> = {
        commentHistory: 'comments',
        summaryHistory: 'summaries',
        likeHistory: 'likes',
        transcriptHistory: 'transcripts'
    };
    incrementStat(statMap[storageKey]);
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

export function saveTranscriptToHistory(data: HistoryData): void {
    saveToHistory('transcriptHistory', data);
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
        } catch {
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
        } catch {
            return false;
        }
    });
}