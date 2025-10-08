
import * as api from '../../shared/api/api';
import * as cache from '../../shared/lib/cache';
import { BaseBody } from '../types';

export async function handleGetVideoInfo(url: string, baseBody: BaseBody): Promise<any> {
    const cacheKey = `info_${url}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        return { success: true, details: cachedData };
    }

    const responseText = await api.fetchVideoInfo(baseBody);
    const videoInfo = JSON.parse(responseText);
    const details = videoInfo[0];
    cache.set(cacheKey, details);

    return { success: true, details: details };
}
