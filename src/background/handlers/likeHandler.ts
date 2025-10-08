
import * as history from '../../shared/lib/history';

export async function handleLikeVideo(url: string): Promise<any> {
    history.saveLikeToHistory({ videoUrl: url, realTimestamp: new Date().toISOString() });
    return { success: true };
}
