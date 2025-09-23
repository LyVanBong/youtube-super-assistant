document.addEventListener('DOMContentLoaded', () => {
    // Hiển thị phiên bản
    const versionNumberSpan = document.getElementById('version-number');
    if (versionNumberSpan) {
        const manifest = chrome.runtime.getManifest();
        versionNumberSpan.textContent = manifest.version || 'N/A';
    }

    // Xử lý chuyển tab
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Xóa trạng thái active của tất cả các nút và panel
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Thêm trạng thái active cho nút và panel được chọn
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
});