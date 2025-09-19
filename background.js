// Xử lý cài đặt mặc định khi tiện ích được cài đặt lần đầu
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        isAutoCommentEnabled: true,
        autoPercentageMin: 30,
        autoPercentageMax: 80,
        aiLanguage: 'English',
        customPrompt: '',
        aiApiKey: '',
        accessToken: '23105d20-3812-44c9-9906-8adf1fd5e69e'
    });
    chrome.storage.local.set({ commentHistory: [] });
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

// Lắng nghe tin nhắn từ content script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'createComment' || request.action === 'createReply') {

        chrome.storage.sync.get([
            'aiLanguage',
            'customPrompt',
            'aiApiKey',
            'accessToken'
        ], (settings) => {

            const token = settings.accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
            const API_URL = `https://workflow.softty.net/webhook/${token}`;

            // **PHẦN ĐƯỢC SỬA: Đã bỏ accessToken khỏi body**
            let requestBody = {
                url: request.url,
                timestamp: request.timestamp,
                language: settings.aiLanguage || 'English',
                prompt: settings.customPrompt || '',
                apiKey: settings.aiApiKey || ''
            };

            if (request.action === 'createReply') {
                requestBody.comment = request.parentComment;
            }

            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })
                .then(response => {
                    if (!response.ok) throw new Error(`API Error: ${response.status}`);
                    return response.text();
                })
                .then(textResponse => {
                    if (request.action === 'createComment') {
                        saveCommentToHistory({
                            videoUrl: request.url,
                            commentContent: textResponse,
                            videoTimestamp: request.timestamp,
                            realTimestamp: new Date().toISOString()
                        });
                    }
                    sendResponse({ success: true, comment: textResponse });
                })
                .catch(error => sendResponse({ success: false, error: error.message }));
        });

        return true; // Báo hiệu phản hồi bất đồng bộ
    }
    else if (request.action === 'isVideoInHistory') {
        const videoIdToCheck = request.videoId;
        if (!videoIdToCheck) {
            sendResponse({ isInHistory: false });
            return true;
        }
        chrome.storage.local.get({ commentHistory: [] }, (result) => {
            const hasValidComment = result.commentHistory.some(item => {
                try {
                    const url = new URL(item.videoUrl);
                    return url.searchParams.get('v') === videoIdToCheck && item.commentContent?.trim() !== '';
                } catch (e) {
                    return false;
                }
            });
            sendResponse({ isInHistory: hasValidComment });
        });
        return true;
    }
});

// Theo dõi sự kiện điều hướng trang để thông báo cho content script
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url && details.url.includes("youtube.com/watch")) {
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" }, () => {
            if (chrome.runtime.lastError) {
                // Bỏ qua lỗi nếu tab không tồn tại
                console.log(`Could not send message to tab ${details.tabId}. Error: ${chrome.runtime.lastError.message}`);
            }
        });
    }
});