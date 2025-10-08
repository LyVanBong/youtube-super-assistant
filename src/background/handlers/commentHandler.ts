
import * as api from '../../shared/api/api';
import * as history from '../../shared/lib/history';
import { BaseBody } from '../types';

interface CommentRequestBody extends BaseBody {
    timestamp?: string;
    comment?: string;
}

export async function handleCreateComment(url: string, timestamp: string | undefined, baseBody: BaseBody): Promise<any> {
    const requestBody: CommentRequestBody = { ...baseBody, timestamp };
    const commentText = await api.generateCommentOrReply(requestBody);
    history.saveCommentToHistory({
        videoUrl: url,
        commentContent: commentText,
        videoTimestamp: timestamp || '00:00',
        realTimestamp: new Date().toISOString()
    });
    return { success: true, content: commentText };
}

export async function handleCreateReply(url: string, parentComment: string | undefined, baseBody: BaseBody): Promise<any> {
    const requestBody: CommentRequestBody = { ...baseBody, comment: parentComment };
    const commentText = await api.generateCommentOrReply(requestBody);
    // Note: Replies are not saved to history in the original logic.
    return { success: true, content: commentText };
}
