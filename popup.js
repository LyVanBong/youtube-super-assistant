document.addEventListener('DOMContentLoaded', function () {
    // --- Lấy các Element ---
    const videoTitleEl = document.getElementById('video-title');
    const historyStatusEl = document.getElementById('history-status');

    const aiActionsCard = document.getElementById('ai-actions-card');
    const defaultStateEl = document.getElementById('ai-actions-default');
    const loadingStateEl = document.getElementById('ai-actions-loading');
    const resultStateEl = document.getElementById('ai-actions-result');
    const loadingStatusEl = document.getElementById('loading-status');
    const resultTextarea = document.getElementById('ai-result-textarea');

    const createCommentBtn = document.getElementById('createCommentBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const commentNowBtn = document.getElementById('commentNowBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const backBtn = document.getElementById('backBtn');

    const autoToggle = document.getElementById('auto-toggle');
    const settingsBtn = document.getElementById('settingsBtn');

    let currentTab = null;
    let lastAction = null; // Lưu hành động cuối cùng ('comment' hoặc 'summary')

    // --- Quản lý Trạng thái UI ---
    function setUiState(state) {
        defaultStateEl.classList.toggle('hidden', state !== 'default');
        loadingStateEl.classList.toggle('hidden', state !== 'loading');
        resultStateEl.classList.toggle('hidden', state !== 'result');

        if (state === 'loading') {
            loadingStatusEl.textContent = lastAction === 'summary'
                ? 'Đang lấy lời thoại và tóm tắt...'
                : 'Đang tạo bình luận...';
        } else if (state === 'result') {
            // **CẬP NHẬT LOGIC UI CHO KẾT QUẢ**
            const isSummary = lastAction === 'summary';
            commentNowBtn.classList.toggle('hidden', isSummary);
            resultTextarea.classList.toggle('summary-mode', isSummary);
        }
    }

    // --- Hàm gửi Tin nhắn đến Background ---
    function sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }
                if (response && response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response ? response.error : 'Có lỗi không xác định xảy ra.'));
                }
            });
        });
    }

    // --- Xử lý các Hành động AI ---
    async function handleAiAction(actionType) {
        if (!currentTab || !currentTab.url) return;
        lastAction = actionType;
        setUiState('loading');

        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, { action: "getTimestamp" });
            const timestamp = response ? response.timestamp : '00:00';

            let message = { url: currentTab.url };
            if (actionType === 'comment') {
                message.action = 'createComment';
                message.timestamp = timestamp;
            } else { // summary
                message.action = 'summarizeVideo';
            }

            const result = await sendMessageToBackground(message);
            resultTextarea.value = result.content;
            setUiState('result');

        } catch (error) {
            alert(`Lỗi: ${error.message}`);
            setUiState('default');
        }
    }

    // --- Gán các Sự kiện ---
    createCommentBtn.addEventListener('click', () => handleAiAction('comment'));
    summarizeBtn.addEventListener('click', () => handleAiAction('summary'));
    regenerateBtn.addEventListener('click', () => handleAiAction(lastAction));

    backBtn.addEventListener('click', () => {
        resultTextarea.value = '';
        setUiState('default');
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultTextarea.value).then(() => {
            copyBtn.textContent = 'Đã sao chép!';
            setTimeout(() => { copyBtn.textContent = 'Sao chép'; }, 1500);
        });
    });

    commentNowBtn.addEventListener('click', () => {
        if (!currentTab) return;
        // **GỬI HÀNH ĐỘNG MỚI: commentNow**
        chrome.tabs.sendMessage(currentTab.id, {
            action: "commentNow",
            content: resultTextarea.value
        });
        window.close();
    });

    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    autoToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ isAutoCommentEnabled: autoToggle.checked });
    });

    // --- Khởi tạo Popup ---
    async function initialize() {
        // Tải cài đặt
        chrome.storage.sync.get({ isAutoCommentEnabled: true }, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled;
        });

        // Lấy thông tin tab hiện tại
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tab;

            if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
                const videoId = new URL(tab.url).searchParams.get('v');
                videoTitleEl.textContent = tab.title.replace(' - YouTube', '');
                createCommentBtn.disabled = false;
                summarizeBtn.disabled = false;

                // Kiểm tra lịch sử
                const response = await sendMessageToBackground({ action: 'isVideoInHistory', videoId: videoId });
                if (response.isInHistory) {
                    historyStatusEl.textContent = 'Trạng thái: ✅ Đã có trong lịch sử bình luận.';
                    historyStatusEl.classList.add('in-history');
                } else {
                    historyStatusEl.textContent = 'Trạng thái: Chưa có trong lịch sử.';
                    historyStatusEl.classList.remove('in-history');
                }
            } else {
                videoTitleEl.textContent = 'Mở một video YouTube để bắt đầu.';
                historyStatusEl.textContent = '';
                aiActionsCard.classList.add('hidden');
            }
        } catch (error) {
            videoTitleEl.textContent = 'Không thể lấy thông tin tab.';
            historyStatusEl.textContent = `Lỗi: ${error.message}`;
            aiActionsCard.classList.add('hidden');
        }
        setUiState('default');
    }

    initialize();
});