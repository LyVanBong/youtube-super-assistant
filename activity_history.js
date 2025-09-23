document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loader = document.getElementById('loader-overlay');
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const tabButtons = document.querySelectorAll('.tab-button');

    // Comment History Elements
    const commentHistoryBody = document.getElementById('comment-history-body');
    const noCommentMsg = document.getElementById('no-comment-history');

    // Summary History Elements
    const summaryHistoryBody = document.getElementById('summary-history-body');
    const noSummaryMsg = document.getElementById('no-summary-history');

    // Transcript History Elements
    const transcriptHistoryGrid = document.getElementById('transcript-history-grid');
    const noTranscriptMsg = document.getElementById('no-transcript-history');

    let fullCommentHistory = [];
    let fullSummaryHistory = [];
    let fullTranscriptHistory = [];
    let activeTab = 'comment-history';

    // --- Utility Functions ---
    const showLoader = () => loader.classList.add('show');
    const hideLoader = () => loader.classList.remove('show');

    // --- Tab Handling ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            activeTab = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(activeTab).classList.add('active');

            filterAndRender();
        });
    });

    // --- Data Loading and Rendering ---
    function loadAllHistory() {
        showLoader();
        Promise.all([
            chrome.storage.local.get({ commentHistory: [] }),
            chrome.storage.local.get({ transcriptHistory: [] }),
            chrome.storage.local.get({ summaryHistory: [] }) // Tải thêm lịch sử tóm tắt
        ]).then(([commentResult, transcriptResult, summaryResult]) => {
            fullCommentHistory = commentResult.commentHistory;
            fullTranscriptHistory = transcriptResult.transcriptHistory;
            fullSummaryHistory = summaryResult.summaryHistory;

            renderCommentHistory(fullCommentHistory);
            renderTranscriptHistory(fullTranscriptHistory);
            renderSummaryHistory(fullSummaryHistory);

            hideLoader();
        });
    }

    function renderCommentHistory(data) {
        commentHistoryBody.innerHTML = '';
        const hasData = data.length > 0;
        noCommentMsg.style.display = hasData ? 'none' : 'block';
        document.getElementById('comment-history-table').style.display = hasData ? 'table' : 'none';

        if (hasData) {
            data.forEach(item => {
                const videoId = new URL(item.videoUrl).searchParams.get('v');
                const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : 'icons/icon128.png';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="video-info">
                            <img src="${thumbnailUrl}" alt="Thumbnail" class="video-thumbnail">
                            <a href="${item.videoUrl}" target="_blank">${item.videoUrl}</a>
                        </div>
                    </td>
                    <td><div class="comment-content">${item.commentContent}</div></td>
                    <td>${item.videoTimestamp}</td>
                    <td>${new Date(item.realTimestamp).toLocaleString('vi-VN')}</td>
                `;
                commentHistoryBody.appendChild(row);
            });
        }
    }

    // **HÀM MỚI**: Render lịch sử tóm tắt
    function renderSummaryHistory(data) {
        summaryHistoryBody.innerHTML = '';
        const hasData = data.length > 0;
        noSummaryMsg.style.display = hasData ? 'none' : 'block';
        document.getElementById('summary-history-table').style.display = hasData ? 'table' : 'none';

        if (hasData) {
            data.forEach(item => {
                const videoId = new URL(item.videoUrl).searchParams.get('v');
                const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : 'icons/icon128.png';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="video-info">
                            <img src="${thumbnailUrl}" alt="Thumbnail" class="video-thumbnail">
                            <a href="${item.videoUrl}" target="_blank">${item.videoUrl}</a>
                        </div>
                    </td>
                    <td><div class="summary-content">${item.summaryContent}</div></td>
                    <td>${new Date(item.realTimestamp).toLocaleString('vi-VN')}</td>
                `;
                summaryHistoryBody.appendChild(row);
            });
        }
    }


    function renderTranscriptHistory(data) {
        transcriptHistoryGrid.innerHTML = '';
        const hasData = data.length > 0;
        noTranscriptMsg.style.display = hasData ? 'none' : 'block';
        transcriptHistoryGrid.style.display = hasData ? 'grid' : 'none';

        if (hasData) {
            data.forEach(item => {
                const videoItem = document.createElement('div');
                videoItem.className = 'video-item';
                videoItem.title = item.title;
                videoItem.innerHTML = `
                    <div class="thumbnail-container"><img src="${item.thumbnailUrl}" alt="Thumbnail"></div>
                    <div class="info-container">
                        <h3 class="video-title">${item.title}</h3>
                        <p class="channel-title">${item.channelTitle}</p>
                    </div>`;
                videoItem.addEventListener('click', () => {
                    chrome.storage.local.set({ transcriptVideoUrl: item.videoUrl }, () => {
                        chrome.tabs.create({ url: 'transcript.html' });
                    });
                });
                transcriptHistoryGrid.appendChild(videoItem);
            });
        }
    }

    // --- Filtering and Events ---
    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();

        if (activeTab === 'comment-history') {
            const filtered = fullCommentHistory.filter(item =>
                item.commentContent.toLowerCase().includes(searchTerm) ||
                item.videoUrl.toLowerCase().includes(searchTerm)
            );
            renderCommentHistory(filtered);
        } else if (activeTab === 'summary-history') {
            const filtered = fullSummaryHistory.filter(item =>
                item.summaryContent.toLowerCase().includes(searchTerm) ||
                item.videoUrl.toLowerCase().includes(searchTerm)
            );
            renderSummaryHistory(filtered);
        } else { // transcript-history
            const filtered = fullTranscriptHistory.filter(item =>
                item.title.toLowerCase().includes(searchTerm) ||
                item.channelTitle.toLowerCase().includes(searchTerm)
            );
            renderTranscriptHistory(filtered);
        }
    }

    searchInput.addEventListener('input', filterAndRender);
    refreshBtn.addEventListener('click', loadAllHistory);

    clearHistoryBtn.addEventListener('click', () => {
        let key, message;
        switch (activeTab) {
            case 'comment-history':
                key = 'commentHistory';
                message = 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử bình luận không?';
                break;
            case 'summary-history':
                key = 'summaryHistory';
                message = 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử tóm tắt không?';
                break;
            case 'transcript-history':
                key = 'transcriptHistory';
                message = 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem lời thoại không?';
                break;
            default: return;
        }

        if (confirm(message)) {
            showLoader();
            chrome.storage.local.set({ [key]: [] }, () => {
                loadAllHistory();
            });
        }
    });

    // Initial Load
    loadAllHistory();
});