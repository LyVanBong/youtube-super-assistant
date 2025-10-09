import * as api from '../../shared/api/api';
import * as cache from '../../shared/lib/cache';
import * as history from '../../shared/lib/history';
import { parseTranscript } from '../../shared/lib/transcript-parser';
import { BaseBody } from '../types';

export async function handleGetTranscriptText(url: string, baseBody: BaseBody): Promise<{ success: boolean; content: string; }> {
    const cacheKey = `transcript_${url}`;
    const cachedData = cache.get<string>(cacheKey);
    if (cachedData) {
        return { success: true, content: cachedData };
    }

    const responseText = await api.fetchTranscript(baseBody);
    const fullText = parseTranscript(responseText);
    cache.set(cacheKey, fullText);

    // Fetch video info to get the title for a richer history entry
    let videoTitle = '';
    try {
        const infoResponseText = await api.fetchVideoInfo(baseBody);
        const videoInfo = JSON.parse(infoResponseText);
        videoTitle = videoInfo[0]?.snippet?.title || '';
    } catch {
        // Silently fail, we can still save history without the title
    }

    // Save the action to history and update stats
    history.saveTranscriptToHistory({
        videoUrl: url,
        realTimestamp: new Date().toISOString(),
        title: videoTitle
    });

    return { success: true, content: fullText };
}

export async function handleOpenTranscriptPage(videoUrl: string): Promise<void> {
    await chrome.storage.local.set({ transcriptVideoUrl: videoUrl });
    await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#transcript') });
}