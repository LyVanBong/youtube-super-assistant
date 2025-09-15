// API endpoint chung
const API_URL = 'https://workflow.softty.net/webhook/23105d20-3812-44c9-9906-8adf1fd5e69e';

// Xử lý cài đặt mặc định khi tiện ích được cài đặt lần đầu
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ isAutoCommentEnabled: true });
    chrome.storage.local.set({ commentHistory: [] }); // Khởi tạo lịch sử
});

// Hàm lưu trữ lịch sử bình luận
function saveCommentToHistory(data) {
    chrome.storage.local.get({ commentHistory: [] }, (result) => {
        const history = result.commentHistory;
        history.unshift(data); // Thêm vào đầu danh sách
        // Giới hạn lịch sử ở 100 bình luận gần nhất để tránh tốn dung lượng
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ commentHistory: history });
    });
}

// Lắng nghe tin nhắn từ content script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'createComment' || request.action === 'createReply') {
        let requestBody;

        if (request.action === 'createComment') {
            requestBody = {
                url: request.url,
                timestamp: request.timestamp
            };
        } else { // createReply
            requestBody = {
                url: request.url,
                comment: request.parentComment,
                timestamp: request.timestamp
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
        .then(textResponse => {
            // Chỉ lưu bình luận chính, không lưu phản hồi để tránh nhầm lẫn
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
        
        return true; // Báo hiệu phản hồi bất đồng bộ
    } 
    // --- LOGIC MỚI ĐƯỢC CẬP NHẬT TẠI ĐÂY ---
    else if (request.action === 'isVideoInHistory') {
        const videoIdToCheck = request.videoId;
        if (!videoIdToCheck) {
            sendResponse({ isInHistory: false });
            return true;
        }
        chrome.storage.local.get({ commentHistory: [] }, (result) => {
            const history = result.commentHistory;

            // 1. Lọc ra tất cả các bình luận trong lịch sử cho video này
            const videoComments = history.filter(item => {
                try {
                    const url = new URL(item.videoUrl);
                    return url.searchParams.get('v') === videoIdToCheck;
                } catch (e) {
                    return false;
                }
            });

            // 2. Nếu không có bình luận nào, cho phép chạy auto
            if (videoComments.length === 0) {
                sendResponse({ isInHistory: false });
                return;
            }

            // 3. Nếu có, kiểm tra xem có ÍT NHẤT MỘT bình luận có nội dung không rỗng
            const hasValidComment = videoComments.some(item => 
                item.commentContent && item.commentContent.trim() !== ''
            );

            // 4. Chỉ khi có bình luận hợp lệ, mới coi là "đã có trong lịch sử" và bỏ qua
            sendResponse({ isInHistory: hasValidComment });
        });
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