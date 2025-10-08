
import * as api from '../../shared/api/api';
import * as cache from '../../shared/lib/cache';
import * as history from '../../shared/lib/history';
import { parseTranscript } from '../../shared/lib/transcript-parser';
import { BaseBody } from '../types';

export async function handleGetTranscriptText(url: string, baseBody: BaseBody): Promise<any> {
    const cacheKey = `transcript_${url}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        return { success: true, content: cachedData };
    }

    const responseText = await api.fetchTranscript(baseBody);
    const fullText = parseTranscript(responseText);
    cache.set(cacheKey, fullText);

    // Save the action to history and update stats
    history.saveTranscriptToHistory({
        videoUrl: url,
        realTimestamp: new Date().toISOString()
    });

    return { success: true, content: fullText };
}

export async function handleOpenTranscriptPage(videoUrl: string): Promise<void> {
    await chrome.storage.local.set({ transcriptVideoUrl: videoUrl });
    await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#transcript') });
}
