
import * as history from '../../shared/lib/history';

export async function handleIsVideoInHistory(videoId: string): Promise<any> {
    const { commentHistory } = await chrome.storage.local.get({ commentHistory: [] });
    const isInHistory = history.isVideoInCommentHistory(videoId, commentHistory);
    return { success: true, isInHistory: isInHistory };
}

export async function handleIsVideoLiked(videoId: string): Promise<any> {
    const { likeHistory } = await chrome.storage.local.get({ likeHistory: [] });
    const isLiked = history.isVideoInLikeHistory(videoId, likeHistory);
    return { success: true, isLiked: isLiked };
}
