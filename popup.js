document.addEventListener('DOMContentLoaded', function() {
    const commentBtn = document.getElementById('commentBtn');
    const resultDiv = document.getElementById('result');

    commentBtn.addEventListener('click', async () => {
        resultDiv.textContent = 'Đang xử lý...';

        // 1. Lấy thông tin tab hiện tại
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const videoUrl = tab.url;

        // 2. Kiểm tra xem có phải là URL video YouTube không
        if (!videoUrl || !videoUrl.includes("youtube.com/watch")) {
            resultDiv.textContent = 'Lỗi: Vui lòng mở một video YouTube.';
            return;
        }

        // 3. Gọi API để tạo bình luận
        try {
            const apiUrl = 'https://workflow.softty.net/webhook/23105d20-3812-44c9-9906-8adf1fd5e69e';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: videoUrl
                })
            });

            if (!response.ok) {
                throw new Error(`API Lỗi: ${response.statusText}`);
            }

            // 4. Lấy kết quả trả về dưới dạng TEXT và hiển thị
            const commentText = await response.text(); // Thay đổi ở đây
            resultDiv.innerHTML = `<strong>Bình luận đã tạo:</strong><br>${commentText}`; // Và ở đây

        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            resultDiv.textContent = `Đã xảy ra lỗi: ${error.message}`;
        }
    });
});