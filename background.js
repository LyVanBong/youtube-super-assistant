// Xử lý cài đặt mặc định khi tiện ích được cài đặt lần đầu
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        isAutoCommentEnabled: false,
        autoPercentageMin: 30,
        autoPercentageMax: 80,
        aiLanguage: 'English',
        customPrompt: '',
        aiApiKey: '',
        accessToken: '23105d20-3812-44c9-9906-8adf1fd5e69e'
    });
    chrome.storage.local.set({ commentHistory: [], transcriptHistory: [] });
});

// Hàm lưu trữ lịch sử bình luận
function saveCommentToHistory(data) {
    chrome.storage.local.get({ commentHistory: [] }, (result) => {
        const history = result.commentHistory;
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ commentHistory: history });
    });
}

// Hàm gọi API chung
async function fetchFromApi(body, queryParam) {
    const settings = await chrome.storage.sync.get(['accessToken']);
    const token = settings.accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
    const API_URL = `https://workflow.softty.net/webhook/${token}${queryParam ? `?${queryParam}=true` : ''}`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Lỗi API (${queryParam || 'comment'}): ${response.status} ${response.statusText}`);
    }
    return response.text();
}


// Lắng nghe tin nhắn từ content script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Bọc logic trong một hàm async để sử dụng await
    const handleMessage = async () => {
        try {
            const settings = await chrome.storage.sync.get(['aiLanguage', 'customPrompt', 'aiApiKey', 'accessToken']);
            const baseBody = {
                url: request.url,
                language: settings.aiLanguage || 'English',
                prompt: settings.customPrompt || '',
                apiKey: settings.aiApiKey || ''
            };

            if (request.action === 'createComment' || request.action === 'createReply') {
                const requestBody = { ...baseBody, timestamp: request.timestamp };
                if (request.action === 'createReply') {
                    requestBody.comment = request.parentComment;
                }
                const commentText = await fetchFromApi(requestBody);

                if (request.action === 'createComment') {
                    saveCommentToHistory({
                        videoUrl: request.url,
                        commentContent: commentText,
                        videoTimestamp: request.timestamp,
                        realTimestamp: new Date().toISOString()
                    });
                }
                sendResponse({ success: true, content: commentText });

            } else if (request.action === 'summarizeVideo') {
                const summaryText = await fetchFromApi(baseBody, 'summarize');
                if (summaryText.includes("không có phụ đề") || summaryText.includes("No transcript")) {
                    throw new Error("Không thể tóm tắt video này vì không có lời thoại (phụ đề).");
                }
                sendResponse({ success: true, content: summaryText });

            } else if (request.action === 'openTranscriptPage') {
                await chrome.storage.local.set({ transcriptVideoUrl: request.videoUrl });
                const transcriptPageUrl = chrome.runtime.getURL('transcript.html');
                await chrome.tabs.create({ url: transcriptPageUrl });
                // Không cần sendResponse cho hành động này

            } else if (request.action === 'isVideoInHistory') {
                const { commentHistory } = await chrome.storage.local.get({ commentHistory: [] });
                const hasValidComment = commentHistory.some(item => {
                    try {
                        return new URL(item.videoUrl).searchParams.get('v') === request.videoId && item.commentContent?.trim() !== '';
                    } catch {
                        return false;
                    }
                });
                sendResponse({ success: true, isInHistory: hasValidComment });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    };

    handleMessage();
    return true; // Bắt buộc để cho phép sendResponse hoạt động bất đồng bộ
});


// Theo dõi sự kiện điều hướng trang để thông báo cho content script
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url && details.url.includes("youtube.com/watch")) {
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" }).catch(err => console.log(`Could not send message to tab ${details.tabId}. It might be closed or reloading.`));
    }
});