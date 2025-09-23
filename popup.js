document.addEventListener('DOMContentLoaded', function () {
    // --- Get elements ---
    const createCommentBtn = document.getElementById('createCommentBtn');
    const btnIcon = document.getElementById('btn-icon');
    const btnText = document.getElementById('btn-text');
    const settingsBtn = document.getElementById('settingsBtn');
    const autoToggle = document.getElementById('auto-toggle');
    const videoTitleEl = document.getElementById('video-title');

    // --- Loading state manager ---
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

    // --- Event Handlers ---
    settingsBtn.addEventListener('click', (event) => {
        event.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    autoToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ isAutoCommentEnabled: autoToggle.checked });
    });

    createCommentBtn.addEventListener('click', async () => {
        setLoading(true);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { action: "getTimestamp" });
            const timestamp = response ? response.timestamp : '00:00';

            chrome.runtime.sendMessage({
                action: 'createComment',
                url: tab.url,
                timestamp: timestamp
            }, (response) => {
                if (chrome.runtime.lastError) {
                    alert(`Lỗi: ${chrome.runtime.lastError.message}`);
                } else if (response && response.success) {
                    alert(`Đã tạo thành công! Nội dung đã được sao chép vào clipboard.\n\nNội dung: ${response.comment}`);
                    navigator.clipboard.writeText(response.comment);
                } else {
                    alert(`Lỗi từ API: ${response ? response.error : 'Không rõ'}`);
                }
                setLoading(false);
            });
        } catch (error) {
            alert(`Lỗi: ${error.message}`);
            setLoading(false);
        }
    });

    // --- Initialization ---
    async function initialize() {
        // Load auto-comment setting
        chrome.storage.sync.get({ isAutoCommentEnabled: true }, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled;
        });

        // Check current tab and update UI
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
                videoTitleEl.textContent = tab.title.replace(' - YouTube', '');
                createCommentBtn.disabled = false;
            } else {
                videoTitleEl.textContent = 'Mở một video YouTube để bắt đầu.';
                createCommentBtn.disabled = true;
            }
        } catch (error) {
            videoTitleEl.textContent = 'Không thể lấy thông tin tab.';
            createCommentBtn.disabled = true;
        }
    }

    initialize();
});