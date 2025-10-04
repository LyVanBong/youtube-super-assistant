import * as cache from '../utils/cache.js';

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
// CÁC HÀM TIỆN ÍCH
// ====================================================================

function saveCommentToHistory(data) { chrome.storage.local.get({ commentHistory: [] }, r => { r.commentHistory.unshift(data); if (r.commentHistory.length > 100) r.commentHistory.pop(); chrome.storage.local.set({ commentHistory: r.commentHistory }); }); }
function saveSummaryToHistory(data) { chrome.storage.local.get({ summaryHistory: [] }, r => { r.summaryHistory.unshift(data); if (r.summaryHistory.length > 100) r.summaryHistory.pop(); chrome.storage.local.set({ summaryHistory: r.summaryHistory }); }); }
function saveLikeToHistory(data) { chrome.storage.local.get({ likeHistory: [] }, r => { r.likeHistory.unshift(data); if (r.likeHistory.length > 100) r.likeHistory.pop(); chrome.storage.local.set({ likeHistory: r.likeHistory }); }); }

async function fetchFromApi(body, queryParam) {
    const { accessToken } = await chrome.storage.sync.get('accessToken');
    const token = accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
    const API_URL = `https://workflow.softty.net/webhook/${token}${queryParam ? `?${queryParam}=true` : ''}`;
    const extensionVersion = chrome.runtime.getManifest().version;

    const response = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'version': extensionVersion },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Lỗi API (${queryParam || 'comment'}): ${response.status} ${response.statusText}`);
    return response.text();
}

// ====================================================================
// LOGIC KIỂM TRA PHIÊN BẢN MỚI
// ====================================================================

function displayBannerInPage(version, logoUrl) {
    if (document.getElementById('sa-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'sa-update-banner';
    Object.assign(banner.style, {
        position: 'fixed', top: '10px', right: '10px', backgroundColor: '#283593',
        color: 'white', padding: '10px 15px', borderRadius: '8px', zIndex: '99999',
        fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center',
        gap: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    });
    banner.innerHTML = `<img src="${logoUrl}" style="width: 24px; height: 24px; vertical-align: middle;"> <span style="vertical-align: middle;">Super Assistant có bản cập nhật mới!</span>`;
    const viewButton = document.createElement('button');
    viewButton.innerText = 'Xem ngay';
    Object.assign(viewButton.style, { padding: '5px 10px', border: 'none', borderRadius: '5px', backgroundColor: '#ffffff', color: '#283593', cursor: 'pointer', fontWeight: 'bold' });
    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    Object.assign(closeButton.style, { fontSize: '20px', cursor: 'pointer', marginLeft: '10px', lineHeight: '1' });
    viewButton.onclick = () => chrome.runtime.sendMessage({ action: "openUpdateNotesPage" });
    closeButton.onclick = () => {
        chrome.runtime.sendMessage({ action: "userDismissedVersion", version: version });
        banner.remove();
    };
    banner.appendChild(viewButton);
    banner.appendChild(closeButton);
    document.body.appendChild(banner);
}

async function checkAndShowBanner(tabId) {
    try {
        const { newVersionInfo, dismissedVersion } = await chrome.storage.local.get(['newVersionInfo', 'dismissedVersion']);
        if (newVersionInfo && newVersionInfo.version !== dismissedVersion) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: displayBannerInPage,
                args: [newVersionInfo.version, chrome.runtime.getURL('icons/icon48.png')]
            }).catch(err => {});
        }
    } catch (e) {}
}

async function handleVersionCheck() {
    const { lastVersionCheck } = await chrome.storage.local.get("lastVersionCheck");
    const oneDay = 24 * 60 * 60 * 1000;
    if (lastVersionCheck && (Date.now() - lastVersionCheck < oneDay)) return;

    try {
        const { accessToken } = await chrome.storage.sync.get('accessToken');
        if (!accessToken) return;
        const currentVersion = chrome.runtime.getManifest().version;
        const apiUrl = `https://workflow.softty.net/webhook/${accessToken}?current_version=${currentVersion}`;
        const response = await fetch(apiUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'version': currentVersion },
            body: JSON.stringify({})
        });
        if (!response.ok) return;
        const data = await response.json();
        await chrome.storage.local.set({ lastVersionCheck: Date.now() });
        if (data && data.new_version) {
            await chrome.storage.local.set({ newVersionInfo: data });
            await chrome.storage.session.set({ updateNotes: data.notes });
        } else {
            await chrome.storage.local.remove(['newVersionInfo', 'dismissedVersion']);
        }
    } catch (error) {}
}

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
                const commentText = await fetchFromApi(requestBody);
                if (request.action === 'createComment') saveCommentToHistory({ videoUrl: request.url, commentContent: commentText, videoTimestamp: request.timestamp, realTimestamp: new Date().toISOString() });
                sendResponse({ success: true, content: commentText });
            } else if (request.action === 'summarizeVideo') {
                const cacheKey = `summary_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, content: cachedData }); return; }
                const responseText = await fetchFromApi(baseBody, 'summarize');
                let summaryText;
                try { summaryText = JSON.parse(responseText).summary; } catch (e) { summaryText = responseText; }
                if (!summaryText || summaryText.includes("không có phụ đề") || summaryText.includes("No transcript")) throw new Error("Không thể tóm tắt video này vì không có lời thoại.");
                cache.set(cacheKey, summaryText);
                saveSummaryToHistory({ videoUrl: request.url, summaryContent: summaryText, realTimestamp: new Date().toISOString() });
                sendResponse({ success: true, content: summaryText });
            } else if (request.action === 'getTranscriptText') {
                const cacheKey = `transcript_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, content: cachedData }); return; }
                const responseText = await fetchFromApi(baseBody, 'transcripts');
                const transcriptData = JSON.parse(responseText);
                if (!Array.isArray(transcriptData) || transcriptData.length === 0) throw new Error("Video này không có lời thoại hoặc định dạng dữ liệu không đúng.");
                if (transcriptData[0]?.message === 'no transcript') throw new Error("Video này không có lời thoại.");
                let rawTranscript = null;
                const transcriptResponse = transcriptData.find(item => item?.data?.transcripts);
                if (transcriptResponse && transcriptResponse.data) {
                    const data = transcriptResponse.data;
                    const langCodeEntry = data.language_code?.[0];
                    const langCode = langCodeEntry?.code;
                    if (langCode && data.transcripts && data.transcripts[langCode]) {
                        const transcripts = data.transcripts[langCode];
                        rawTranscript = transcripts.custom || transcripts.default || transcripts.auto;
                    }
                }
                if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
                    const fullText = rawTranscript.map(seg => seg.text).join(' ');
                    cache.set(cacheKey, fullText);
                    sendResponse({ success: true, content: fullText });
                } else {
                    throw new Error("Không tìm thấy nội dung lời thoại hợp lệ.");
                }
            } else if (request.action === 'openTranscriptPage') {
                await chrome.storage.local.set({ transcriptVideoUrl: request.videoUrl });
                await chrome.tabs.create({ url: chrome.runtime.getURL('pages/transcript/transcript.html') });
            } else if (request.action === 'isVideoInHistory') {
                const { commentHistory } = await chrome.storage.local.get({ commentHistory: [] });
                const hasValidComment = commentHistory.some(item => { try { return new URL(item.videoUrl).searchParams.get('v') === request.videoId && item.commentContent?.trim() !== ''; } catch { return false; } });
                sendResponse({ success: true, isInHistory: hasValidComment });
            } else if (request.action === 'isVideoLiked') {
                const { likeHistory } = await chrome.storage.local.get({ likeHistory: [] });
                const isLiked = likeHistory.some(item => { try { return new URL(item.videoUrl).searchParams.get('v') === request.videoId; } catch { return false; } });
                sendResponse({ success: true, isLiked: isLiked });
            } else if (request.action === 'likeVideo') {
                saveLikeToHistory({ videoUrl: request.url, realTimestamp: new Date().toISOString() });
                sendResponse({ success: true });
            } else if (request.action === 'getVideoInfo') {
                const cacheKey = `info_${request.url}`;
                const cachedData = cache.get(cacheKey);
                if (cachedData) { sendResponse({ success: true, details: cachedData }); return; }
                const responseText = await fetchFromApi(baseBody, 'infovideo');
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
        await handleVersionCheck();
        await checkAndShowBanner(details.tabId);
    }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        await checkAndShowBanner(details.tabId);
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" }).catch(err => { });
    }
});