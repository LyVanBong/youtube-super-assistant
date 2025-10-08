import * as cache from '../shared/lib/cache';
import * as history from '../shared/lib/history';
import * as api from '../shared/api/api';
import * as versioning from '../shared/api/versioning';
import { parseTranscript } from '../shared/lib/transcript-parser';

// ====================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU
// ====================================================================

interface BaseRequest {
    action: string;
    url?: string;
    videoUrl?: string;
    videoId?: string;
    version?: string;
    timestamp?: string;
    parentComment?: string;
}

// ====================================================================
// KHỞI TẠO VÀ CÀI ĐẶT
// ====================================================================

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.sync.set({
            isAutoCommentEnabled: false, autoPercentageMin: 30, autoPercentageMax: 80,
            isAutoLikeEnabled: true, autoLikePercentageMin: 50, autoLikePercentageMax: 80,
            aiLanguage: 'English', customPrompt: '', aiApiKey: '',
            accessToken: '23105d20-3812-44c9-9906-8adf1fd5e69e'
        });
        chrome.storage.local.set({ commentHistory: [], transcriptHistory: [], summaryHistory: [], likeHistory: [] });
        const guideUrl = "https://blogs.softty.net/tien-ich-ai-tang-tuong-tac-youtube/";
        chrome.tabs.create({ url: guideUrl });
    }
    chrome.storage.local.remove(['lastVersionCheck', 'newVersionInfo', 'dismissedVersion']);
});

// ====================================================================
// TRÌNH LẮNG NGHE TRUNG TÂM
// ====================================================================

chrome.runtime.onMessage.addListener((request: BaseRequest, sender, sendResponse) => {
    (async () => {
        if (request.action === "openUpdateNotesPage") {
            chrome.tabs.create({ url: chrome.runtime.getURL('update_notes.html') });
            return;
        } else if (request.action === "userDismissedVersion" && request.version) {
            await chrome.storage.local.set({ dismissedVersion: request.version });
            return;
        }

        try {
            const settings = await chrome.storage.sync.get(['aiLanguage', 'customPrompt', 'aiApiKey']);
            const baseBody = { url: request.url || '', language: settings.aiLanguage || 'English', prompt: settings.customPrompt || '', apiKey: settings.aiApiKey || '' };

            if ((request.action === 'createComment' || request.action === 'createReply') && request.url) {
                const requestBody: any = { ...baseBody, timestamp: request.timestamp };
                if (request.action === 'createReply') requestBody.comment = request.parentComment;
                const commentText = await api.generateCommentOrReply(requestBody);
                if (request.action === 'createComment') {
                    history.saveCommentToHistory({ videoUrl: request.url, commentContent: commentText, videoTimestamp: request.timestamp || '00:00', realTimestamp: new Date().toISOString() });
                }
                sendResponse({ success: true, content: commentText });
            } else if (request.action === 'summarizeVideo' && request.url) {
                const cacheKey = `summary_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, content: cachedData }); return; }
                const responseText = await api.fetchSummary(baseBody);
                let summaryText;
                try { summaryText = JSON.parse(responseText).summary; } catch (e) { summaryText = responseText; }
                if (!summaryText || summaryText.includes("không có phụ đề") || summaryText.includes("No transcript")) throw new Error("Không thể tóm tắt video này vì không có lời thoại.");
                cache.set(cacheKey, summaryText);
                history.saveSummaryToHistory({ videoUrl: request.url, summaryContent: summaryText, realTimestamp: new Date().toISOString() });
                sendResponse({ success: true, content: summaryText });
            } else if (request.action === 'getTranscriptText' && request.url) {
                const cacheKey = `transcript_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, content: cachedData }); return; }
                const responseText = await api.fetchTranscript(baseBody);
                const fullText = parseTranscript(responseText);
                cache.set(cacheKey, fullText);
                sendResponse({ success: true, content: fullText });
            } else if (request.action === 'openTranscriptPage' && request.videoUrl) {
                await chrome.storage.local.set({ transcriptVideoUrl: request.videoUrl });
                await chrome.tabs.create({ url: chrome.runtime.getURL('transcript.html') });
            } else if (request.action === 'isVideoInHistory' && request.videoId) {
                const { commentHistory } = await chrome.storage.local.get({ commentHistory: [] });
                const isInHistory = history.isVideoInCommentHistory(request.videoId, commentHistory);
                sendResponse({ success: true, isInHistory: isInHistory });
            } else if (request.action === 'isVideoLiked' && request.videoId) {
                const { likeHistory } = await chrome.storage.local.get({ likeHistory: [] });
                const isLiked = history.isVideoInLikeHistory(request.videoId, likeHistory);
                sendResponse({ success: true, isLiked: isLiked });
            } else if (request.action === 'likeVideo' && request.url) {
                history.saveLikeToHistory({ videoUrl: request.url, realTimestamp: new Date().toISOString() });
                sendResponse({ success: true });
            } else if (request.action === 'getVideoInfo' && request.url) {
                const cacheKey = `info_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, details: cachedData }); return; }
                const responseText = await api.fetchVideoInfo(baseBody);
                const videoInfo = JSON.parse(responseText);
                const details = videoInfo[0];
                cache.set(cacheKey, details);
                sendResponse({ success: true, details: details });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            sendResponse({ success: false, error: errorMessage });
        }
    })();
    return true; // Required for async sendResponse.
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        await versioning.handleVersionCheck();
        await versioning.checkAndShowBanner(details.tabId);
    }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        await versioning.checkAndShowBanner(details.tabId);
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" }).catch(err => { });
    }
});
