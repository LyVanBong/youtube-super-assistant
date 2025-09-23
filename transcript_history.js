document.addEventListener('DOMContentLoaded', () => {
    const historyGrid = document.getElementById('history-grid');
    const noHistoryMsg = document.getElementById('no-history-msg');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const loaderOverlay = document.getElementById('loader-overlay');

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
        // Thêm một chút delay để người dùng thấy hiệu ứng loading
        setTimeout(() => {
            chrome.storage.local.get({ transcriptHistory: [] }, (result) => {
                renderHistory(result.transcriptHistory);
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

    // Tải lịch sử lần đầu khi trang được mở
    loadHistory();
});