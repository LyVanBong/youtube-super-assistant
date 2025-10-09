import * as api from '../../shared/api/api';
import * as cache from '../../shared/lib/cache';
import { BaseBody } from '../types';

interface VideoDetails {
    snippet?: {
        channelTitle: string;
        title: string;
    };
    [key: string]: unknown;
}

export async function handleGetVideoInfo(url: string, baseBody: BaseBody): Promise<{ success: boolean; details: VideoDetails }> {
    const cacheKey = `info_${url}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        return { success: true, details: cachedData as VideoDetails };
    }

    const responseText = await api.fetchVideoInfo(baseBody);
    const videoInfo = JSON.parse(responseText);
    const details = videoInfo[0];
    cache.set(cacheKey, details);

    return { success: true, details: details };
}