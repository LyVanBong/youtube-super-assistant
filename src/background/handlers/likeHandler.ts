import * as api from '../../shared/api/api';
import * as history from '../../shared/lib/history';
import { BaseBody } from '../types';

export async function handleLikeVideo(url: string, baseBody: BaseBody): Promise<{ success: boolean; }> {
    // Fetch video info to get the title for a richer history entry
    let videoTitle = '';
    try {
        const infoResponseText = await api.fetchVideoInfo(baseBody);
        const videoInfo = JSON.parse(infoResponseText);
        videoTitle = videoInfo[0]?.snippet?.title || '';
    } catch {
        // Silently fail, we can still save history without the title
    }

    history.saveLikeToHistory({
        videoUrl: url,
        realTimestamp: new Date().toISOString(),
        title: videoTitle
    });
    
    return { success: true };
}