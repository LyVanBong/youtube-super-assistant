import * as api from '../../shared/api/api';
import * as cache from '../../shared/lib/cache';
import * as history from '../../shared/lib/history';
import { BaseBody } from '../types';

export async function handleSummarizeVideo(url: string, baseBody: BaseBody): Promise<{ success: boolean; content: string; }> {
    const cacheKey = `summary_${url}`;
    const cachedData = cache.get<string>(cacheKey);
    if (cachedData) {
        return { success: true, content: cachedData };
    }

    const responseText = await api.fetchSummary(baseBody);
    let summaryText;
    try {
        summaryText = JSON.parse(responseText).summary;
    } catch {
        summaryText = responseText;
    }

    if (!summaryText || summaryText.includes("không có phụ đề") || summaryText.includes("No transcript")) {
        throw new Error("Không thể tóm tắt video này vì không có lời thoại.");
    }

    cache.set(cacheKey, summaryText);

    // Fetch video info to get the title for a richer history entry
    let videoTitle = '';
    try {
        const infoResponseText = await api.fetchVideoInfo(baseBody);
        const videoInfo = JSON.parse(infoResponseText);
        videoTitle = videoInfo[0]?.snippet?.title || '';
    } catch {
        // Silently fail, we can still save history without the title
    }

    history.saveSummaryToHistory({
        videoUrl: url,
        summaryContent: summaryText,
        realTimestamp: new Date().toISOString(),
        title: videoTitle
    });

    return { success: true, content: summaryText };
}