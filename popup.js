document.addEventListener('DOMContentLoaded', function () {
    // Lấy các element từ DOM
    const createCommentBtn = document.getElementById('createCommentBtn');
    const resultDiv = document.getElementById('result');
    const btnIcon = document.getElementById('btn-icon');
    const btnText = document.getElementById('btn-text');
    const settingsBtn = document.getElementById('settingsBtn');

    // --- Quản lý trạng thái loading của nút tạo bình luận ---
    function setLoading(isLoading) {
        if (isLoading) {
            createCommentBtn.disabled = true;
            btnIcon.innerHTML = '<div class="spinner"></div>';
            btnText.textContent = 'Đang tạo...';
        } else {
            createCommentBtn.disabled = false;
            btnIcon.innerHTML = '✨';
            btnText.textContent = 'Tạo bình luận AI';
        }
    }

    // --- XỬ LÝ SỰ KIỆN CHO NÚT CÀI ĐẶT ---
    // Đây là phần quan trọng nhất để sửa lỗi
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Ngăn hành động mặc định của thẻ <a>
            chrome.runtime.openOptionsPage(); // Mở trang được định nghĩa trong "options_page" của manifest.json
        });
    }

    // --- Xử lý sự kiện click nút tạo bình luận ---
    createCommentBtn.addEventListener('click', async () => {
        setLoading(true);
        resultDiv.textContent = ''; 

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url || !tab.url.includes("youtube.com/watch")) {
                throw new Error('Vui lòng mở một video YouTube.');
            }

            const response = await chrome.tabs.sendMessage(tab.id, { action: "getTimestamp" });
            const timestamp = response ? response.timestamp : '00:00';

            chrome.runtime.sendMessage({
                action: 'createComment',
                url: tab.url,
                timestamp: timestamp
            }, (response) => {
                if (chrome.runtime.lastError) {
                    resultDiv.textContent = `Lỗi: ${chrome.runtime.lastError.message}`;
                } else if (response && response.success) {
                    resultDiv.textContent = `Đã tạo: ${response.comment}`;
                } else {
                    resultDiv.textContent = `Lỗi từ API: ${response ? response.error : 'Không rõ'}`;
                }
                setLoading(false);
            });
        } catch (error) {
            resultDiv.textContent = `Lỗi: ${error.message}`;
            setLoading(false);
        }
    });
});