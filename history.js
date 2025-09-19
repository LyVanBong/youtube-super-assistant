document.addEventListener('DOMContentLoaded', () => {
    const historyBody = document.getElementById('history-body');
    const noHistoryMsg = document.getElementById('no-history');
    const clearHistoryBtn = document.getElementById('clear-history');
    const refreshBtn = document.getElementById('refresh-btn');
    const loaderOverlay = document.getElementById('loader-overlay'); // Lấy phần tử loader

    // Hàm để hiển thị và ẩn loader
    function showLoader() {
        loaderOverlay.classList.add('show');
    }

    function hideLoader() {
        loaderOverlay.classList.remove('show');
    }

    function loadHistory() {
        showLoader(); // Hiển thị loader trước khi lấy dữ liệu

        // Thêm một độ trễ nhỏ để người dùng thấy được hiệu ứng
        setTimeout(() => {
            chrome.storage.local.get({ commentHistory: [] }, (result) => {
                const history = result.commentHistory;
                historyBody.innerHTML = ''; // Xóa nội dung cũ

                if (history.length === 0) {
                    noHistoryMsg.style.display = 'block';
                    document.getElementById('history-table').style.display = 'none';
                } else {
                    noHistoryMsg.style.display = 'none';
                    document.getElementById('history-table').style.display = 'table';
                    history.forEach(item => {
                        const row = document.createElement('tr');
                        const videoCell = document.createElement('td');
                        videoCell.innerHTML = `<a href="${item.videoUrl}" target="_blank">${item.videoUrl}</a>`;

                        const contentCell = document.createElement('td');
                        contentCell.innerHTML = `<div class="comment-content">${item.commentContent}</div>`;

                        const videoTsCell = document.createElement('td');
                        videoTsCell.textContent = item.videoTimestamp;

                        const realTsCell = document.createElement('td');
                        const realDate = new Date(item.realTimestamp);
                        realTsCell.textContent = realDate.toLocaleString('vi-VN');

                        row.appendChild(videoCell);
                        row.appendChild(contentCell);
                        row.appendChild(videoTsCell);
                        row.appendChild(realTsCell);
                        historyBody.appendChild(row);
                    });
                }
                hideLoader(); // Ẩn loader sau khi đã tải xong dữ liệu
            });
        }, 300); // 300ms delay
    }

    refreshBtn.addEventListener('click', loadHistory);

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử bình luận không?')) {
            showLoader(); // Hiển thị loader trước khi xóa
            setTimeout(() => {
                chrome.storage.local.set({ commentHistory: [] }, () => {
                    loadHistory(); // Tải lại giao diện, hàm này đã có hideLoader() bên trong
                    // alert('Đã xóa lịch sử.'); // Có thể bỏ alert vì loader đã là một phản hồi tốt
                });
            }, 300);
        }
    });

    // Tải lịch sử lần đầu khi trang được mở
    loadHistory();
});