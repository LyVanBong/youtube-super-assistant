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
    const copyTranscriptBtn = document.getElementById('copyTranscriptBtn'); // Nút mới
    const copyBtn = document.getElementById('copyBtn');
    const commentNowBtn = document.getElementById('commentNowBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const backBtn = document.getElementById('backBtn');

    const autoToggle = document.getElementById('auto-toggle');
    const settingsBtn = document.getElementById('settingsBtn');
    const languageSelect = document.getElementById('ai-language-select');
    const versionInfoEl = document.getElementById('version-info');

    let currentTab = null;
    let lastAction = null;

    // --- Quản lý Trạng thái UI ---
    function setUiState(state) {
        defaultStateEl.classList.toggle('hidden', state !== 'default');
        loadingStateEl.classList.toggle('hidden', state !== 'loading');
        resultStateEl.classList.toggle('hidden', state !== 'result');

        if (state === 'loading') {
            if (lastAction === 'summary') {
                loadingStatusEl.textContent = 'Đang tóm tắt...';
            } else if (lastAction === 'comment') {
                loadingStatusEl.textContent = 'Đang tạo bình luận...';
            } else if (lastAction === 'transcript') {
                loadingStatusEl.textContent = 'Đang lấy lời thoại...';
            }
        } else if (state === 'result') {
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

    // **SỰ KIỆN MỚI**: Sao chép lời thoại
    copyTranscriptBtn.addEventListener('click', async () => {
        if (!currentTab || !currentTab.url) return;
        lastAction = 'transcript';
        const originalText = copyTranscriptBtn.innerHTML;
        copyTranscriptBtn.innerHTML = '<div class="spinner" style="width:20px; height:20px; border-width:3px;"></div>';
        copyTranscriptBtn.disabled = true;

        try {
            const result = await sendMessageToBackground({ action: 'getTranscriptText', url: currentTab.url });
            navigator.clipboard.writeText(result.content);
            copyTranscriptBtn.innerHTML = '✅ Đã chép!';
            setTimeout(() => {
                copyTranscriptBtn.innerHTML = originalText;
                copyTranscriptBtn.disabled = false;
            }, 2000);
        } catch (error) {
            alert(`Lỗi: ${error.message}`);
            copyTranscriptBtn.innerHTML = originalText;
            copyTranscriptBtn.disabled = false;
        }
    });


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

    languageSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ aiLanguage: languageSelect.value });
    });

    // --- Hàm tải danh sách ngôn ngữ ---
    async function populateLanguages() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/independent?status=true&fields=languages');
            if (!response.ok) throw new Error('Network response was not ok');
            const countries = await response.json();
            const languageMap = new Map();
            countries.forEach(country => {
                if (country.languages) {
                    for (const code in country.languages) {
                        const name = country.languages[code];
                        if (!languageMap.has(name)) languageMap.set(name, name);
                    }
                }
            });
            const sortedLanguages = [...languageMap.keys()].sort((a, b) => a.localeCompare(b));
            languageSelect.innerHTML = '';
            sortedLanguages.forEach(langName => {
                const option = document.createElement('option');
                option.value = langName;
                option.textContent = langName;
                languageSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to fetch languages:', error);
            languageSelect.innerHTML = '<option value="English">English</option><option value="Vietnamese">Tiếng Việt</option>';
        }
    }

    // --- Khởi tạo Popup ---
    async function initialize() {
        const manifest = chrome.runtime.getManifest();
        versionInfoEl.textContent = `Phiên bản hiện tại: ${manifest.version}`;

        await populateLanguages();

        chrome.storage.sync.get({ isAutoCommentEnabled: true, aiLanguage: 'English' }, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled;
            if ([...languageSelect.options].some(o => o.value === data.aiLanguage)) {
                languageSelect.value = data.aiLanguage;
            } else {
                languageSelect.value = 'English';
            }
        });

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tab;

            if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
                const videoId = new URL(tab.url).searchParams.get('v');
                videoTitleEl.textContent = tab.title.replace(' - YouTube', '');
                createCommentBtn.disabled = false;
                summarizeBtn.disabled = false;
                copyTranscriptBtn.disabled = false;

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