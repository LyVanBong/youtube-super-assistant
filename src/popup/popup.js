document.addEventListener('DOMContentLoaded', function () {
    // --- Lấy các Element --- //
    const videoInfoCard = document.getElementById('video-info-card');
    const videoTitleEl = document.getElementById('video-title');
    const historyStatusEl = document.getElementById('history-status');
    const videoDetailsEl = document.getElementById('video-details');
    const videoThumbnailEl = document.getElementById('video-thumbnail');
    const channelNameEl = document.getElementById('channel-name');
    const viewCountEl = document.getElementById('view-count');
    const likeCountEl = document.getElementById('like-count');
    const publishDateEl = document.getElementById('publish-date');

    const dashboardView = document.getElementById('dashboard-view');
    const aiProcessingView = document.getElementById('ai-processing-view');

    const loadingStateEl = document.getElementById('ai-actions-loading');
    const resultStateEl = document.getElementById('ai-actions-result');
    const loadingStatusEl = document.getElementById('loading-status');
    const resultTextarea = document.getElementById('ai-result-textarea');

    // Nút actions
    const createCommentBtn = document.getElementById('createCommentBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const historyBtn = document.getElementById('historyBtn');
    const transcriptBtn = document.getElementById('transcriptBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const aboutBtn = document.getElementById('aboutBtn');

    // Nút kết quả AI
    const copyBtn = document.getElementById('copyBtn');
    const commentNowBtn = document.getElementById('commentNowBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const backBtn = document.getElementById('backBtn');

    // Cài đặt nhanh
    const autoToggle = document.getElementById('auto-toggle');
    const autoLikeToggle = document.getElementById('auto-like-toggle');
    const languageSelect = document.getElementById('ai-language-select');
    const versionInfoEl = document.getElementById('version-info');

    let currentTab = null;
    let lastAction = null; // 'comment' or 'summary'

    // --- Quản lý Trạng thái UI --- //
    function setUiView(view) {
        dashboardView.classList.toggle('hidden', view !== 'dashboard');
        aiProcessingView.classList.toggle('hidden', view !== 'processing');
    }

    function setAiResultState(state) {
        loadingStateEl.classList.toggle('hidden', state !== 'loading');
        resultStateEl.classList.toggle('hidden', state !== 'result');

        if (state === 'loading') {
            if (lastAction === 'summary') {
                loadingStatusEl.textContent = 'Đang tóm tắt...';
            } else if (lastAction === 'comment') {
                loadingStatusEl.textContent = 'Đang tạo bình luận...';
            }
        } else if (state === 'result') {
            commentNowBtn.classList.toggle('hidden', lastAction === 'summary');
        }
    }

    // --- Hàm gửi Tin nhắn --- //
    function sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }
                if (response && response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response ? response.error : 'Lỗi không xác định.'));
                }
            });
        });
    }

    // --- Xử lý các Hành động AI --- //
    async function handleAiAction(actionType) {
        if (!currentTab || !currentTab.url) return;
        lastAction = actionType;
        setUiView('processing');
        setAiResultState('loading');

        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, { action: "getTimestamp" });
            const timestamp = response ? response.timestamp : '00:00';

            const message = {
                action: actionType === 'comment' ? 'createComment' : 'summarizeVideo',
                url: currentTab.url,
                timestamp: timestamp
            };

            const result = await sendMessageToBackground(message);
            resultTextarea.value = result.content;
            setAiResultState('result');

        } catch (error) {
            alert(`Lỗi: ${error.message}`);
            setUiView('dashboard');
        }
    }

    // --- Hàm tải danh sách ngôn ngữ --- //
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
        } finally {
            // Tải cài đặt ngôn ngữ đã lưu sau khi tải xong
            chrome.storage.sync.get({ aiLanguage: 'English' }, (data) => {
                if ([...languageSelect.options].some(o => o.value === data.aiLanguage)) {
                    languageSelect.value = data.aiLanguage;
                } else {
                    languageSelect.value = 'English';
                }
            });
        }
    }

    // --- Gán các Sự kiện --- //
    createCommentBtn.addEventListener('click', () => handleAiAction('comment'));
    summarizeBtn.addEventListener('click', () => handleAiAction('summary'));

    historyBtn.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('pages/activity_history/activity_history.html') }));
    transcriptBtn.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('pages/transcript/transcript.html') }));
    settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
    aboutBtn.addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('pages/about/about.html') }));

    backBtn.addEventListener('click', () => setUiView('dashboard'));
    regenerateBtn.addEventListener('click', () => handleAiAction(lastAction));
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultTextarea.value).then(() => {
            copyBtn.textContent = 'Đã sao chép!';
            setTimeout(() => { copyBtn.textContent = 'Sao chép'; }, 1500);
        });
    });
    commentNowBtn.addEventListener('click', () => {
        if (!currentTab) return;
        chrome.tabs.sendMessage(currentTab.id, { action: "commentNow", content: resultTextarea.value });
        window.close();
    });

    autoToggle.addEventListener('change', () => chrome.storage.sync.set({ isAutoCommentEnabled: autoToggle.checked }));
    autoLikeToggle.addEventListener('change', () => chrome.storage.sync.set({ isAutoLikeEnabled: autoLikeToggle.checked }));
    languageSelect.addEventListener('change', () => chrome.storage.sync.set({ aiLanguage: languageSelect.value }));

    // --- Khởi tạo Popup --- //
    async function initialize() {
        const manifest = chrome.runtime.getManifest();
        versionInfoEl.textContent = `v${manifest.version}`;

        populateLanguages();

        chrome.storage.sync.get({ isAutoCommentEnabled: true, isAutoLikeEnabled: true }, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled;
            autoLikeToggle.checked = data.isAutoLikeEnabled;
        });

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tab;
            const isYoutubeVideo = tab && tab.url && tab.url.includes("youtube.com/watch");

            createCommentBtn.disabled = !isYoutubeVideo;
            summarizeBtn.disabled = !isYoutubeVideo;

            if (isYoutubeVideo) {
                videoInfoCard.classList.remove('hidden');
                const videoId = new URL(tab.url).searchParams.get('v');
                videoTitleEl.textContent = tab.title.replace(' - YouTube', '');

                // Lấy thông tin chi tiết video
                sendMessageToBackground({ action: 'getVideoInfo', url: tab.url })
                    .then(response => {
                        if (response && response.details) {
                            const { snippet = {}, statistics = {} } = response.details;
                            videoThumbnailEl.src = snippet.thumbnails?.medium?.url || '../icons/icon128.png';
                            channelNameEl.textContent = snippet.channelTitle || 'N/A';
                            viewCountEl.textContent = Number(statistics.viewCount || 0).toLocaleString('vi-VN');
                            likeCountEl.textContent = Number(statistics.likeCount || 0).toLocaleString('vi-VN');
                            publishDateEl.textContent = snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString('vi-VN') : 'N/A';
                            videoDetailsEl.classList.remove('hidden');
                        }
                    }).catch(err => console.error("Lỗi khi lấy thông tin video:", err));

                // Kiểm tra lịch sử video
                const historyResponse = await sendMessageToBackground({ action: 'isVideoInHistory', videoId: videoId });
                historyStatusEl.textContent = historyResponse.isInHistory ? 'Trạng thái: ✅ Đã có trong lịch sử.' : 'Trạng thái: Chưa có trong lịch sử.';
                historyStatusEl.classList.toggle('in-history', historyResponse.isInHistory);

            } else {
                videoInfoCard.classList.add('hidden');
            }
        } catch (error) {
            console.error("Lỗi khởi tạo popup:", error);
            videoInfoCard.classList.remove('hidden');
            videoTitleEl.textContent = 'Lỗi khi lấy thông tin tab.';
            createCommentBtn.disabled = true;
            summarizeBtn.disabled = true;
        }

        setUiView('dashboard');
    }

    initialize();
});