document.addEventListener('DOMContentLoaded', () => {
    // --- Các element cài đặt chung ---
    const autoToggle = document.getElementById('auto-toggle');
    const aiLanguageSelect = document.getElementById('ai-language');
    const customPrompt = document.getElementById('custom-prompt');
    const saveBtn = document.getElementById('save-btn');

    // --- Các element cho thanh trượt kép ---
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const valuesLabel = document.getElementById('range-values-label');
    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'slider-track';
    rangeMin.parentElement.appendChild(sliderTrack);

    // --- HÀM TẢI VÀ ĐIỀN DANH SÁCH NGÔN NGỮ TỪ API ---
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
                        if (!languageMap.has(name)) {
                            languageMap.set(name, name);
                        }
                    }
                }
            });

            const sortedLanguages = [...languageMap.keys()].sort((a, b) => a.localeCompare(b));
            aiLanguageSelect.innerHTML = ''; // Xóa tùy chọn "Loading..."

            sortedLanguages.forEach(langName => {
                const option = document.createElement('option');
                option.value = langName;
                option.textContent = langName;
                aiLanguageSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Failed to fetch languages:', error);
            aiLanguageSelect.innerHTML = '<option value="English">English</option><option value="Vietnamese">Tiếng Việt</option>';
            const errorOption = document.createElement('option');
            errorOption.textContent = 'Lỗi tải danh sách';
            errorOption.disabled = true;
            aiLanguageSelect.prepend(errorOption);
        }
    }

    // --- HÀM XỬ LÝ THANH TRƯỢT KÉP ---
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

    // --- HÀM LƯU VÀ TẢI CÀI ĐẶT ---
    function loadSettings() {
        const defaults = {
            isAutoCommentEnabled: true,
            autoPercentageMin: 30,
            autoPercentageMax: 80,
            aiLanguage: 'English', // Ngôn ngữ mặc định là English
            customPrompt: ''
        };

        chrome.storage.sync.get(defaults, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled;
            customPrompt.value = data.customPrompt;
            rangeMin.value = data.autoPercentageMin;
            rangeMax.value = data.autoPercentageMax;
            
            // **PHẦN SỬA LỖI QUAN TRỌNG**
            // Đảm bảo giá trị được chọn là một tùy chọn hợp lệ trong danh sách
            if (aiLanguageSelect.querySelector(`option[value="${data.aiLanguage}"]`)) {
                aiLanguageSelect.value = data.aiLanguage;
            } else {
                // Nếu ngôn ngữ đã lưu không có trong danh sách (ví dụ: API lỗi),
                // thì chọn English làm mặc định
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
            customPrompt: customPrompt.value
        };

        chrome.storage.sync.set(settings, () => {
            saveBtn.textContent = 'Đã lưu!';
            setTimeout(() => { saveBtn.textContent = 'Lưu Cài đặt'; }, 1500);
        });
    }

    saveBtn.addEventListener('click', saveSettings);

    // --- CHUỖI KHỞI TẠO ---
    populateLanguages().then(() => {
        loadSettings();
    });
});