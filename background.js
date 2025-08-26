// Lắng nghe tin nhắn từ content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Chỉ xử lý tin nhắn có action là 'createComment'
    if (request.action === 'createComment') {
        const videoUrl = request.url;
        const apiUrl = 'https://workflow.softty.net/webhook/23105d20-3812-44c9-9906-8adf1fd5e69e';

        // Gọi API bằng fetch
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: videoUrl
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            return response.text(); // Lấy kết quả dạng text
        })
        .then(commentText => {
            // Gửi kết quả thành công về cho content script
            sendResponse({ success: true, comment: commentText });
        })
        .catch(error => {
            console.error('Lỗi khi gọi API:', error);
            // Gửi thông báo lỗi về cho content script
            sendResponse({ success: false, error: error.message });
        });

        // Rất quan trọng: return true để báo rằng sendResponse sẽ được gọi bất đồng bộ
        return true; 
    }
});