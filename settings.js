document.addEventListener('DOMContentLoaded', () => {
    // --- Các element cài đặt ---
    const autoToggle = document.getElementById('auto-toggle');
    const aiLanguageSelect = document.getElementById('ai-language');
    const customPrompt = document.getElementById('custom-prompt');
    const saveBtn = document.getElementById('save-btn');
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const valuesLabel = document.getElementById('range-values-label');
    const aiApiKeyInput = document.getElementById('ai-api-key');
    const accessTokenInput = document.getElementById('access-token');
    const toggleApiKeyBtn = document.getElementById('toggle-api-key');
    const toggleAccessTokenBtn = document.getElementById('toggle-access-token');

    // --- Thiết lập thanh trượt kép ---
    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'slider-track';
    rangeMin.parentElement.appendChild(sliderTrack);

    // --- Tải danh sách ngôn ngữ từ API ---
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
            aiLanguageSelect.innerHTML = ''; 
            sortedLanguages.forEach(langName => {
                const option = document.createElement('option');
                option.value = langName;
                option.textContent = langName;
                aiLanguageSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to fetch languages:', error);
            aiLanguageSelect.innerHTML = '<option value="English">English</option><option value="Vietnamese">Tiếng Việt</option>';
        }
    }

    // --- Xử lý thanh trượt kép ---
    function updateSliderAppearance() {
        let minVal = parseInt(rangeMin.value);
        let maxVal = parseInt(rangeMax.value);
        if (minVal > maxVal - 5) {
            if (this && this.id === 'range-min') { rangeMin.value = maxVal - 5; } 
            else { rangeMax.value = minVal + 5; }
        }
        valuesLabel.textContent = `${rangeMin.value}% - ${rangeMax.value}%`;
        const minPercent = ((rangeMin.value - rangeMin.min) / (rangeMin.max - rangeMin.min)) * 100;
        const maxPercent = ((rangeMax.value - rangeMax.min) / (rangeMax.max - rangeMax.min)) * 100;
        sliderTrack.style.left = `${minPercent}%`;
        sliderTrack.style.width = `${maxPercent - minPercent}%`;
    }
    rangeMin.addEventListener('input', updateSliderAppearance);
    rangeMax.addEventListener('input', updateSliderAppearance);

    // --- Xử lý nút xem/ẩn mật khẩu ---
    function setupToggleVisibility(button, input) {
        button.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = '🙈';
            } else {
                input.type = 'password';
                button.textContent = '👁️';
            }
        });
    }
    setupToggleVisibility(toggleApiKeyBtn, aiApiKeyInput);
    setupToggleVisibility(toggleAccessTokenBtn, accessTokenInput);

    // --- Tải và Lưu cài đặt ---
    function loadSettings() {
        const defaults = {
            isAutoCommentEnabled: true,
            autoPercentageMin: 30,
            autoPercentageMax: 80,
            aiLanguage: 'English',
            customPrompt: '',
            aiApiKey: '',
            accessToken: ''
        };
        chrome.storage.sync.get(defaults, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled;
            customPrompt.value = data.customPrompt;
            rangeMin.value = data.autoPercentageMin;
            rangeMax.value = data.autoPercentageMax;
            aiApiKeyInput.value = data.aiApiKey;
            accessTokenInput.value = data.accessToken;
            if (aiLanguageSelect.querySelector(`option[value="${data.aiLanguage}"]`)) {
                aiLanguageSelect.value = data.aiLanguage;
            } else {
                aiLanguageSelect.value = 'English';
            }
            updateSliderAppearance();
        });
    }

    function saveSettings() {
        const settings = {
            isAutoCommentEnabled: autoToggle.checked,
            autoPercentageMin: parseInt(rangeMin.value, 10),
            autoPercentageMax: parseInt(rangeMax.value, 10),
            aiLanguage: aiLanguageSelect.value,
            customPrompt: customPrompt.value,
            aiApiKey: aiApiKeyInput.value.trim(),
            accessToken: accessTokenInput.value.trim()
        };
        chrome.storage.sync.set(settings, () => {
            saveBtn.textContent = 'Đã lưu!';
            setTimeout(() => { saveBtn.textContent = 'Lưu Cài đặt'; }, 1500);
        });
    }
    saveBtn.addEventListener('click', saveSettings);

    // --- Khởi tạo ---
    populateLanguages().then(() => {
        loadSettings();
    });
});