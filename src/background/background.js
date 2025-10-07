import * as cache from '../utils/cache.js';
import * as history from '../utils/history.js';
import * as api from '../services/api.js';
import * as versioning from '../services/versioning.js';
import { parseTranscript } from '../utils/transcript-parser.js';

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        // --- Nhóm action phiên bản mới (không cần response) ---

        if (request.action === "openUpdateNotesPage") {
            chrome.tabs.create({ url: chrome.runtime.getURL('pages/update_notes/update_notes.html') });
            return;
        } else if (request.action === "userDismissedVersion") {
            await chrome.storage.local.set({ dismissedVersion: request.version });
            return;
        }

        // --- Nhóm action nghiệp vụ cũ (cần response) ---

        try {
            const settings = await chrome.storage.sync.get(['aiLanguage', 'customPrompt', 'aiApiKey']);
            const baseBody = { url: request.url, language: settings.aiLanguage || 'English', prompt: settings.customPrompt || '', apiKey: settings.aiApiKey || '' };

            if (request.action === 'createComment' || request.action === 'createReply') {
                const requestBody = { ...baseBody, timestamp: request.timestamp };
                if (request.action === 'createReply') requestBody.comment = request.parentComment;
                const commentText = await api.generateCommentOrReply(requestBody);
                if (request.action === 'createComment') history.saveCommentToHistory({ videoUrl: request.url, commentContent: commentText, videoTimestamp: request.timestamp, realTimestamp: new Date().toISOString() });
                sendResponse({ success: true, content: commentText });
            } else if (request.action === 'summarizeVideo') {
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
            } else if (request.action === 'getTranscriptText') {
                const cacheKey = `transcript_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, content: cachedData }); return; }
                const responseText = await api.fetchTranscript(baseBody);
                const fullText = parseTranscript(responseText);
                cache.set(cacheKey, fullText);
                sendResponse({ success: true, content: fullText });
            } else if (request.action === 'openTranscriptPage') {
                await chrome.storage.local.set({ transcriptVideoUrl: request.videoUrl });
                await chrome.tabs.create({ url: chrome.runtime.getURL('pages/transcript/transcript.html') });
            } else if (request.action === 'isVideoInHistory') {
                const { commentHistory } = await chrome.storage.local.get({ commentHistory: [] });
                const isInHistory = history.isVideoInCommentHistory(request.videoId, commentHistory);
                sendResponse({ success: true, isInHistory: isInHistory });
            } else if (request.action === 'isVideoLiked') {
                const { likeHistory } = await chrome.storage.local.get({ likeHistory: [] });
                const isLiked = history.isVideoInLikeHistory(request.videoId, likeHistory);
                sendResponse({ success: true, isLiked: isLiked });
            } else if (request.action === 'likeVideo') {
                history.saveLikeToHistory({ videoUrl: request.url, realTimestamp: new Date().toISOString() });
                sendResponse({ success: true });
            } else if (request.action === 'getVideoInfo') {
                const cacheKey = `info_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, details: cachedData }); return; }
                const responseText = await api.fetchVideoInfo(baseBody);
                const videoInfo = JSON.parse(responseText);
                const details = videoInfo[0];
                cache.set(cacheKey, details);
                sendResponse({ success: true, details: details });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    })();
    return true;
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