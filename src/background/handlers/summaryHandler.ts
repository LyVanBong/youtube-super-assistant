
import * as api from '../../shared/api/api';
import * as cache from '../../shared/lib/cache';
import * as history from '../../shared/lib/history';
import { BaseBody } from '../types';

export async function handleSummarizeVideo(url: string, baseBody: BaseBody): Promise<any> {
    const cacheKey = `summary_${url}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        return { success: true, content: cachedData };
    }

    const responseText = await api.fetchSummary(baseBody);
    let summaryText;
    try {
        summaryText = JSON.parse(responseText).summary;
    } catch (e) {
        summaryText = responseText;
    }

    if (!summaryText || summaryText.includes("không có phụ đề") || summaryText.includes("No transcript")) {
        throw new Error("Không thể tóm tắt video này vì không có lời thoại.");
    }

    cache.set(cacheKey, summaryText);
    history.saveSummaryToHistory({ videoUrl: url, summaryContent: summaryText, realTimestamp: new Date().toISOString() });

    return { success: true, content: summaryText };
}
