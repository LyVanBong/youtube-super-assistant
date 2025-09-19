document.addEventListener('DOMContentLoaded', function () {
    const createCommentBtn = document.getElementById('createCommentBtn');
    const resultDiv = document.getElementById('result');
    const autoToggle = document.getElementById('auto-toggle');
    const btnIcon = document.getElementById('btn-icon');
    const btnText = document.getElementById('btn-text');

    // --- Quản lý trạng thái loading ---
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

    // --- Quản lý công tắc Tự động ---
    // Khởi tạo trạng thái của công tắc
    chrome.storage.sync.get('isAutoCommentEnabled', (data) => {
        autoToggle.checked = data.isAutoCommentEnabled !== false;
    });

    // Lắng nghe sự kiện thay đổi
    autoToggle.addEventListener('change', () => {
        const isEnabled = autoToggle.checked;
        chrome.storage.sync.set({ isAutoCommentEnabled: isEnabled });
    });


    // --- Xử lý sự kiện click nút chính ---
    createCommentBtn.addEventListener('click', async () => {
        setLoading(true);
        resultDiv.textContent = ''; // Xóa kết quả cũ

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