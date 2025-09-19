document.addEventListener('DOMContentLoaded', () => {
    const historyBody = document.getElementById('history-body');
    const noHistoryMsg = document.getElementById('no-history');
    const clearHistoryBtn = document.getElementById('clear-history');
    const refreshBtn = document.getElementById('refresh-btn');
    const loaderOverlay = document.getElementById('loader-overlay');
    const searchInput = document.getElementById('search-input');

    let fullHistory = []; // Lưu trữ toàn bộ lịch sử để tìm kiếm

    function showLoader() { loaderOverlay.classList.add('show'); }
    function hideLoader() { loaderOverlay.classList.remove('show'); }

    function getVideoId(url) {
        try {
            const urlParams = new URLSearchParams(new URL(url).search);
            return urlParams.get('v');
        } catch (e) { return null; }
    }

    function renderHistory(historyData) {
        historyBody.innerHTML = '';
        if (historyData.length === 0) {
            noHistoryMsg.style.display = 'block';
            document.getElementById('history-table').style.display = 'none';
        } else {
            noHistoryMsg.style.display = 'none';
            document.getElementById('history-table').style.display = 'table';
            historyData.forEach(item => {
                const videoId = getVideoId(item.videoUrl);
                const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : 'icons/icon128.png';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="video-info">
                            <img src="${thumbnailUrl}" alt="Video thumbnail" class="video-thumbnail">
                            <a href="${item.videoUrl}" target="_blank" class="video-url">${item.videoUrl}</a>
                        </div>
                    </td>
                    <td><div class="comment-content">${item.commentContent}</div></td>
                    <td class="timestamp">${item.videoTimestamp}</td>
                    <td class="timestamp">${new Date(item.realTimestamp).toLocaleString('vi-VN')}</td>
                `;
                historyBody.appendChild(row);
            });
        }
    }

    function loadHistory() {
        showLoader();
        setTimeout(() => {
            chrome.storage.local.get({ commentHistory: [] }, (result) => {
                fullHistory = result.commentHistory;
                renderHistory(fullHistory);
                hideLoader();
            });
        }, 300);
    }

    // --- Event Listeners ---
    refreshBtn.addEventListener('click', loadHistory);

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử bình luận không?')) {
            showLoader();
            chrome.storage.local.set({ commentHistory: [] }, () => {
                loadHistory();
            });
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderHistory(fullHistory);
            return;
        }
        const filteredHistory = fullHistory.filter(item =>
            item.commentContent.toLowerCase().includes(searchTerm) ||
            item.videoUrl.toLowerCase().includes(searchTerm)
        );
        renderHistory(filteredHistory);
    });

    loadHistory(); // Tải lần đầu
});