// Listener cũ: Xử lý yêu cầu tạo comment từ content.js (giữ nguyên)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'createComment') {
        const videoUrl = request.url;
        const apiUrl = 'https://workflow.softty.net/webhook/23105d20-3812-44c9-9906-8adf1fd5e69e';

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: videoUrl })
        })
        .then(response => {
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return response.text();
        })
        .then(commentText => sendResponse({ success: true, comment: commentText }))
        .catch(error => sendResponse({ success: false, error: error.message }));

        return true; 
    }
});

// Listener MỚI: Theo dõi sự kiện điều hướng trang trên YouTube
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    // Chỉ kích hoạt khi URL là của một video YouTube
    if (details.url && details.url.includes("youtube.com/watch*")) {
        console.log('[Background] Phát hiện điều hướng đến video mới:', details.url);
        // Gửi một tin nhắn đến content script trong tab đó để báo nó chạy lại
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" });
    }
});