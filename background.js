// API endpoint chung
const API_URL = 'https://workflow.softty.net/webhook/23105d20-3812-44c9-9906-8adf1fd5e69e';

// Lắng nghe tin nhắn từ content script hoặc popup để gọi API
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let requestBody;
    
    // Xác định nội dung yêu cầu dựa trên hành động
    if (request.action === 'createComment') {
        requestBody = { url: request.url };
    } else if (request.action === 'createReply') {
        requestBody = { url: request.url, comment: request.parentComment };
    } else {
        return false; // Không xử lý các hành động không xác định
    }

    // Gọi API
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
    
    return true; // Báo hiệu rằng sendResponse sẽ được gọi bất đồng bộ
});

// Theo dõi sự kiện điều hướng trang để thông báo cho content script
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    // Chỉ kích hoạt khi URL là của một video trên YouTube
    if (details.url && details.url.includes("youtube.com/watch*")) {
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" }, () => {
            // Xử lý lỗi một cách nhẹ nhàng nếu content script không tồn tại
            if (chrome.runtime.lastError) {
                console.log(`Could not send message to tab ${details.tabId}. Error: ${chrome.runtime.lastError.message}`);
            }
        });
    }
});