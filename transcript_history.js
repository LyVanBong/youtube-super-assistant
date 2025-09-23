document.addEventListener('DOMContentLoaded', () => {
    const historyGrid = document.getElementById('history-grid');
    const noHistoryMsg = document.getElementById('no-history-msg');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const loaderOverlay = document.getElementById('loader-overlay');
    const searchInput = document.getElementById('search-input');

    let fullHistory = []; // Biến để lưu trữ toàn bộ lịch sử

    function showLoader() { loaderOverlay.classList.add('show'); }
    function hideLoader() { loaderOverlay.classList.remove('show'); }

    function renderHistory(historyData = []) {
        historyGrid.innerHTML = '';
        if (historyData.length === 0) {
            noHistoryMsg.style.display = 'block';
            historyGrid.style.display = 'none';
        } else {
            noHistoryMsg.style.display = 'none';
            historyGrid.style.display = 'grid';

            historyData.forEach(item => {
                const videoItem = document.createElement('div');
                videoItem.className = 'video-item';
                videoItem.title = item.title;
                videoItem.innerHTML = `
                    <div class="thumbnail-container">
                        <img src="${item.thumbnailUrl}" alt="Video Thumbnail">
                    </div>
                    <div class="info-container">
                        <h3 class="video-title">${item.title}</h3>
                        <p class="channel-title">${item.channelTitle}</p>
                    </div>
                `;

                videoItem.addEventListener('click', () => {
                    chrome.storage.local.set({ transcriptVideoUrl: item.videoUrl }, () => {
                        chrome.tabs.create({ url: 'transcript.html' });
                    });
                });

                historyGrid.appendChild(videoItem);
            });
        }
    }

    function loadHistory() {
        showLoader();
        setTimeout(() => {
            chrome.storage.local.get({ transcriptHistory: [] }, (result) => {
                fullHistory = result.transcriptHistory; // Lưu vào biến toàn cục
                renderHistory(fullHistory);
                hideLoader();
            });
        }, 300);
    }

    // --- Gán sự kiện cho các nút ---
    refreshBtn.addEventListener('click', loadHistory);

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem transcript không?')) {
            showLoader();
            chrome.storage.local.set({ transcriptHistory: [] }, () => {
                loadHistory();
            });
        }
    });

    // --- Gán sự kiện cho ô tìm kiếm ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderHistory(fullHistory); // Nếu ô tìm kiếm trống, hiển thị lại đầy đủ
            return;
        }
        const filteredHistory = fullHistory.filter(item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.channelTitle.toLowerCase().includes(searchTerm)
        );
        renderHistory(filteredHistory);
    });

    // Tải lịch sử lần đầu khi trang được mở
    loadHistory();
});