// API endpoint chung
const API_URL = 'https://workflow.softty.net/webhook/23105d20-3812-44c9-9906-8adf1fd5e69e';

// Xử lý cài đặt mặc định khi tiện ích được cài đặt lần đầu
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ isAutoCommentEnabled: true });
});

// Lắng nghe tin nhắn từ content script hoặc popup để gọi API
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'createComment' || request.action === 'createReply') {
        let requestBody;

        // Xây dựng body cho request, bao gồm cả timestamp
        if (request.action === 'createComment') {
            requestBody = {
                url: request.url,
                timestamp: request.timestamp // Thêm tham số mới
            };
        } else { // createReply
            requestBody = {
                url: request.url,
                comment: request.parentComment,
                timestamp: request.timestamp // Thêm tham số mới
            };
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
        .then(textResponse => sendResponse({ success: true, comment: textResponse }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; // Báo hiệu phản hồi bất đồng bộ
    }
});

// Theo dõi sự kiện điều hướng trang để thông báo cho content script
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url && details.url.includes("youtube.com/watch")) {
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" }, () => {
            if (chrome.runtime.lastError) {
                console.log(`Could not send message to tab ${details.tabId}. Error: ${chrome.runtime.lastError.message}`);
            }
        });
    }
});

