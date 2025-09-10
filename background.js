// API endpoint chung
const API_URL = 'https://workflow.softty.net/webhook/23105d20-3812-44c9-9906-8adf1fd5e69e';

// Lắng nghe tin nhắn từ content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Trường hợp 1: Tạo bình luận mới (như cũ)
    if (request.action === 'createComment') {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: request.url }) // Chỉ gửi URL
        })
        .then(response => {
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return response.text();
        })
        .then(commentText => sendResponse({ success: true, comment: commentText }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; // Báo hiệu phản hồi bất đồng bộ
    }

    // --- TÍNH NĂNG MỚI ---
    // Trường hợp 2: Tạo phản hồi cho một bình luận đã có
    if (request.action === 'createReply') {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Gửi cả URL và nội dung bình luận gốc
            body: JSON.stringify({
                url: request.url,
                comment: request.parentComment
            })
        })
        .then(response => {
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return response.text();
        })
        .then(replyText => sendResponse({ success: true, comment: replyText }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; // Báo hiệu phản hồi bất đồng bộ
    }
});

// Listener theo dõi sự kiện điều hướng trang (giữ nguyên)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url && details.url.includes("/watch")) {
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" });
    }
});