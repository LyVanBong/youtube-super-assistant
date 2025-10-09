import * as api from '../../shared/api/api';
import * as history from '../../shared/lib/history';
import { BaseBody } from '../types';

interface CommentRequestBody extends BaseBody {
    timestamp?: string;
    comment?: string;
}

export async function handleCreateComment(url: string, timestamp: string | undefined, baseBody: BaseBody): Promise<{ success: boolean; content: string; }> {
    const requestBody: CommentRequestBody = { ...baseBody, timestamp };
    const commentText = await api.generateCommentOrReply(requestBody);

    // Fetch video info to get the title for a richer history entry
    let videoTitle = '';
    try {
        const infoResponseText = await api.fetchVideoInfo(baseBody);
        const videoInfo = JSON.parse(infoResponseText);
        videoTitle = videoInfo[0]?.snippet?.title || '';
    } catch {
        // Silently fail, we can still save history without the title
    }

    history.saveCommentToHistory({
        videoUrl: url,
        commentContent: commentText,
        videoTimestamp: timestamp || '00:00',
        realTimestamp: new Date().toISOString(),
        title: videoTitle
    });

    return { success: true, content: commentText };
}

export async function handleCreateReply(url: string, parentComment: string | undefined, baseBody: BaseBody): Promise<{ success: boolean; content: string; }> {
    const requestBody: CommentRequestBody = { ...baseBody, comment: parentComment };
    const commentText = await api.generateCommentOrReply(requestBody);
    // Note: Replies are not saved to history in the original logic.
    return { success: true, content: commentText };
}