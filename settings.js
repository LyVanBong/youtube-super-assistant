document.addEventListener('DOMContentLoaded', () => {
    const autoToggle = document.getElementById('auto-toggle');
    const aiLanguage = document.getElementById('ai-language');
    const customPrompt = document.getElementById('custom-prompt');
    const saveBtn = document.getElementById('save-btn');

    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const valuesLabel = document.getElementById('range-values-label');
    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'slider-track';
    rangeMin.parentElement.appendChild(sliderTrack);

    function updateSliderAppearance() {
        let minVal = parseInt(rangeMin.value);
        let maxVal = parseInt(rangeMax.value);

        if (minVal > maxVal - 5) {
            if (this.id === 'range-min') {
                rangeMin.value = maxVal - 5;
            } else {
                rangeMax.value = minVal + 5;
            }
        }
        
        valuesLabel.textContent = `${rangeMin.value}% - ${rangeMax.value}%`;
        const minPercent = ((rangeMin.value - rangeMin.min) / (rangeMin.max - rangeMin.min)) * 100;
        const maxPercent = ((rangeMax.value - rangeMax.min) / (rangeMax.max - rangeMax.min)) * 100;
        
        sliderTrack.style.left = `${minPercent}%`;
        sliderTrack.style.width = `${maxPercent - minPercent}%`;
    }

    rangeMin.addEventListener('input', updateSliderAppearance);
    rangeMax.addEventListener('input', updateSliderAppearance);

    function loadSettings() {
        const defaults = {
            isAutoCommentEnabled: true,
            autoPercentageMin: 30,
            autoPercentageMax: 80,
            aiLanguage: 'Vietnamese',
            customPrompt: ''
        };

        chrome.storage.sync.get(defaults, (data) => {
            autoToggle.checked = data.isAutoCommentEnabled;
            aiLanguage.value = data.aiLanguage;
            customPrompt.value = data.customPrompt;
            
            rangeMin.value = data.autoPercentageMin;
            rangeMax.value = data.autoPercentageMax;
            updateSliderAppearance();
        });
    }

    function saveSettings() {
        const settings = {
            isAutoCommentEnabled: autoToggle.checked,
            autoPercentageMin: parseInt(rangeMin.value, 10),
            autoPercentageMax: parseInt(rangeMax.value, 10),
            aiLanguage: aiLanguage.value,
            customPrompt: customPrompt.value
        };

        chrome.storage.sync.set(settings, () => {
            saveBtn.textContent = 'Đã lưu!';
            setTimeout(() => { saveBtn.textContent = 'Lưu Cài đặt'; }, 1500);
        });
    }

    saveBtn.addEventListener('click', saveSettings);
    loadSettings();
});