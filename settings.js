document.addEventListener('DOMContentLoaded', () => {
    // Lấy các element từ DOM
    const autoToggle = document.getElementById('auto-toggle');
    const autoPercentage = document.getElementById('auto-percentage');
    const percentageLabel = document.getElementById('percentage-label');
    const aiLanguage = document.getElementById('ai-language');
    const customPrompt = document.getElementById('custom-prompt');
    const saveBtn = document.getElementById('save-btn');

    const SETTINGS_KEYS = [
        'isAutoCommentEnabled',
        'autoCommentPercentage',
        'aiLanguage',
        'customPrompt'
    ];

    // Cập nhật label của thanh trượt
    autoPercentage.addEventListener('input', () => {
        percentageLabel.textContent = `${autoPercentage.value}%`;
    });

    // Hàm tải cài đặt
    function loadSettings() {
        chrome.storage.sync.get(SETTINGS_KEYS, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled !== false; // Mặc định là true
            
            const percentage = data.autoCommentPercentage || 80; // Mặc định 80%
            autoPercentage.value = percentage;
            percentageLabel.textContent = `${percentage}%`;

            aiLanguage.value = data.aiLanguage || 'Vietnamese'; // Mặc định Tiếng Việt
            customPrompt.value = data.customPrompt || '';
        });
    }

    // Hàm lưu cài đặt
    function saveSettings() {
        const settings = {
            isAutoCommentEnabled: autoToggle.checked,
            autoCommentPercentage: parseInt(autoPercentage.value, 10),
            aiLanguage: aiLanguage.value,
            customPrompt: customPrompt.value
        };

        chrome.storage.sync.set(settings, () => {
            // Phản hồi cho người dùng
            saveBtn.textContent = 'Đã lưu!';
            saveBtn.classList.add('saved');
            setTimeout(() => {
                saveBtn.textContent = 'Lưu Cài đặt';
                saveBtn.classList.remove('saved');
            }, 1500);
        });
    }

    // Gán sự kiện cho nút lưu
    saveBtn.addEventListener('click', saveSettings);

    // Tải cài đặt khi trang được mở
    loadSettings();
});