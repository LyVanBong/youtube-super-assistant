/**
 * YouTube Super Assistant - Content Script
 * -----------------------------------------
 * Chịu trách nhiệm chèn giao diện người dùng vào trang YouTube,
 * quản lý các hành động tự động và giao tiếp với background script.
 */

console.log('[Super Assistant] Content script đã được tải và sẵn sàng.');

// --- BIẾN TOÀN CỤC ---
let observer;
let automationHasRun = false;
let progressCheckInterval;
let currentVideoId = null;

// --- BỘ ICON SVG CHUYÊN NGHIỆP (ĐÃ SỬA LỖI CÚ PHÁP) ---
const SVG_ICONS = {
    arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>',
    comment: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    robot: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4m0 16v-4m8-8h-4m-8 0H4m15.5 2.5l-3-3m-10 0l-3 3m10 5l3 3m-10 0l3-3"></path><circle cx="12" cy="12" r="2"></circle><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"></path></svg>',
    robotOff: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
    transcript: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>'
};

// --- CÁC HÀM TRỢ GIÚP (HELPER FUNCTIONS) ---
const humanizedDelay = (min = 800, max = 1600) => new Promise(res => setTimeout(res, Math.random() * (max - min) + min));
function getVideoIdFromUrl(url) { try { return new URLSearchParams(new URL(url).search).get('v'); } catch (e) { return null; } }
function getVideoTimestamp() {
    const video = document.querySelector('video.html5-main-video');
    if (video && video.currentTime) {
        const totalSeconds = Math.floor(video.currentTime);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return '00:00';
}
function scrollToElement(selector, blockOption = 'center') {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (!element) return reject(`Không tìm thấy phần tử: ${selector}`);
        element.scrollIntoView({ behavior: 'smooth', block: blockOption });
        setTimeout(() => resolve(element), 1000);
    });
}
function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                clearTimeout(timer);
                resolve(element);
            }
        }, 500);
        const timer = setTimeout(() => {
            clearInterval(interval);
            reject(`Hết thời gian chờ phần tử: ${selector}`);
        }, timeout);
    });
}
function sendMessagePromise(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            if (response && response.success) return resolve(response);
            reject(new Error(response ? response.error : 'Phản hồi không thành công.'));
        });
    });
}

// --- HIỆU ỨNG LOADING VÀ THÔNG BÁO ---
function injectStyles() {
    const styleId = 'super-assistant-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @keyframes super-assistant-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .super-assistant-loading-spinner {
            position: absolute; width: 48px; height: 48px; border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.2); border-top-color: #4285F4;
            animation: super-assistant-spin 1s linear infinite;
        }`;
    document.head.appendChild(style);
}

function setButtonLoadingState(button, isLoading) {
    const spinnerId = `spinner-for-${button.title.replace(/\s/g, '-')}`;
    const svgElement = button.querySelector('svg');
    let spinner = document.getElementById(spinnerId);
    if (isLoading) {
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.id = spinnerId;
            spinner.className = 'super-assistant-loading-spinner';
            button.appendChild(spinner);
        }
        button.disabled = true;
        if (svgElement) svgElement.style.opacity = '0.5';
    } else {
        if (spinner) spinner.remove();
        button.disabled = false;
        if (svgElement) svgElement.style.opacity = '1';
    }
}

function showContentToast(message, isError = false) {
    let toast = document.getElementById('super-assistant-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'super-assistant-toast';
        Object.assign(toast.style, {
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#28a745', color: 'white', padding: '12px 20px',
            borderRadius: '6px', zIndex: '10000', fontSize: '16px',
            opacity: '0', transition: 'opacity 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        });
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc3545' : '#007bff';
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// --- TÍNH NĂNG SAO CHÉP LỜI THOẠI (TẠM ẨN) ---
function copyTranscript() {
    showContentToast('Tính năng đang được phát triển.');
}

// --- CHUỖI HÀNH ĐỘNG TỰ ĐỘNG ---
async function runFullAutomation(expectedVideoId) {
    const checkContext = () => { if (getVideoIdFromUrl(window.location.href) !== expectedVideoId) throw new Error('Page context changed.'); };
    try {
        console.log('[Super Assistant] Bắt đầu chuỗi tự động cho video:', expectedVideoId);
        checkContext();
        await scrollToElement('ytd-comments#comments');
        await humanizedDelay();
        checkContext();
        (await waitForElement('ytd-comment-simplebox-renderer #placeholder-area')).click();
        checkContext();
        const response = await sendMessagePromise({ action: 'createComment', url: window.location.href, timestamp: getVideoTimestamp() });
        checkContext();
        const commentBox = await waitForElement('ytd-commentbox #contenteditable-root');
        commentBox.innerText = response.comment;
        commentBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        await humanizedDelay();
        checkContext();
        (await waitForElement('ytd-commentbox #submit-button button:not([disabled])')).click();
        await humanizedDelay(2500, 4000);
        checkContext();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[Super Assistant] Hoàn tất chuỗi hành động!');
    } catch (error) {
        console.warn('[Super Assistant] Lỗi trong chuỗi tự động:', error.message);
    }
}

// --- BỘ KÍCH HOẠT TỰ ĐỘNG ---
async function setupVideoProgressListener() {
    if (progressCheckInterval) clearInterval(progressCheckInterval);
    try {
        const video = await waitForElement('video.html5-main-video', 10000);
        const defaults = { isAutoCommentEnabled: true, autoPercentageMin: 30, autoPercentageMax: 80 };
        chrome.storage.sync.get(defaults, (settings) => {
            if (settings.isAutoCommentEnabled === false) {
                console.log('[Super Assistant] Tự động bình luận đang tắt. Bỏ qua.');
                return;
            }
            const min = settings.autoPercentageMin / 100;
            const max = settings.autoPercentageMax / 100;
            const activationThreshold = Math.random() * (max - min) + min;
            console.log(`[Super Assistant] Ngưỡng kích hoạt ngẫu nhiên được đặt là: ${(activationThreshold * 100).toFixed(2)}%`);
            progressCheckInterval = setInterval(() => {
                document.querySelector('.ytp-ad-skip-button-container .ytp-ad-skip-button, .ytp-ad-skip-button.ytp-button')?.click();
                if (video && video.duration && !automationHasRun && (video.currentTime / video.duration) >= activationThreshold) {
                    automationHasRun = true;
                    clearInterval(progressCheckInterval);
                    chrome.runtime.sendMessage({ action: 'isVideoInHistory', videoId: currentVideoId }, (response) => {
                        if (chrome.runtime.lastError || (response && !response.isInHistory)) {
                            runFullAutomation(currentVideoId);
                        } else {
                            console.log('[Super Assistant] Video đã có trong lịch sử. Bỏ qua tự động bình luận.');
                        }
                    });
                }
            }, 3000);
        });
    } catch (error) {
        console.error('[Super Assistant] Không tìm thấy video player để theo dõi:', error);
    }
}

// --- CÁC HÀM CHÈN GIAO DIỆN (UI INJECTION) ---
function createOrUpdateFloatingButtons() {
    const isWatchPage = window.location.href.includes('/watch');
    const containerId = 'super-assistant-floating-buttons';
    let container = document.getElementById(containerId);
    if (isWatchPage) {
        if (!container) {
            injectStyles();
            container = document.createElement('div');
            container.id = containerId;
            Object.assign(container.style, { position: 'fixed', bottom: '30px', right: '30px', zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '10px' });
            const buttonStyles = { backgroundColor: 'rgba(15, 15, 15, 0.9)', color: 'white', border: '1px solid #3f3f3f', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', transition: 'all 0.2s ease' };
            const createButton = (icon, title, onClick) => {
                const btn = document.createElement('button');
                btn.innerHTML = icon;
                btn.title = title;
                Object.assign(btn.style, buttonStyles);
                btn.addEventListener('click', onClick);
                btn.onmouseover = () => { if (!btn.disabled) btn.style.transform = 'scale(1.1)'; };
                btn.onmouseout = () => { if (!btn.disabled) btn.style.transform = 'scale(1.0)'; };
                return btn;
            };
            const scrollToTopBtn = createButton(SVG_ICONS.arrowUp, 'Cuộn lên trên cùng', () => {
                setButtonLoadingState(scrollToTopBtn, true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setButtonLoadingState(scrollToTopBtn, false), 1000);
            });
            const scrollToCommentBtn = createButton(SVG_ICONS.comment, 'Cuộn đến bình luận', () => {
                setButtonLoadingState(scrollToCommentBtn, true);
                scrollToElement('ytd-comments#comments')
                    .then(() => new Promise(resolve => setTimeout(resolve, 500)))
                    .then(() => document.querySelector('ytd-comment-simplebox-renderer #placeholder-area')?.click())
                    .catch(console.error)
                    .finally(() => setButtonLoadingState(scrollToCommentBtn, false));
            });
            const copyTranscriptBtn = createButton(SVG_ICONS.transcript, 'Sao chép Lời thoại', () => {
                setButtonLoadingState(copyTranscriptBtn, true);
                copyTranscript();
                setTimeout(() => setButtonLoadingState(copyTranscriptBtn, false), 500);
            });
            const autoToggleButton = createButton('', 'Bật/Tắt Tự động Bình luận', () => { chrome.storage.sync.get('isAutoCommentEnabled', (data) => { chrome.storage.sync.set({ isAutoCommentEnabled: !(data.isAutoCommentEnabled !== false) }); }); });
            const updateToggleButtonUI = (isEnabled) => {
                autoToggleButton.innerHTML = isEnabled ? SVG_ICONS.robot : SVG_ICONS.robotOff;
                autoToggleButton.style.backgroundColor = isEnabled ? '#4285F4' : 'rgba(15, 15, 15, 0.9)';
            };
            chrome.storage.sync.get({ isAutoCommentEnabled: true }, (data) => updateToggleButtonUI(data.isAutoCommentEnabled));
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'sync' && changes.isAutoCommentEnabled) {
                    updateToggleButtonUI(changes.isAutoCommentEnabled.newValue);
                }
            });
            container.append(scrollToTopBtn, scrollToCommentBtn, copyTranscriptBtn, autoToggleButton);
            document.body.appendChild(container);
        }
        container.style.display = 'flex';
    } else {
        if (container) container.style.display = 'none';
    }
}

function injectAICommentButton() {
    const buttonsContainer = document.querySelector("ytd-commentbox #buttons");
    if (!buttonsContainer || buttonsContainer.querySelector('.ai-comment-btn-super')) return;
    const aiButton = document.createElement('button');
    aiButton.innerText = 'Bình luận AI';
    aiButton.className = 'ai-comment-btn-super';
    Object.assign(aiButton.style, { backgroundColor: 'var(--yt-spec-brand-button-background, #065fd4)', color: 'var(--yt-spec-static-brand-white, white)', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer', marginRight: '8px', lineHeight: 'normal', transition: 'background-color .2s, opacity .2s' });
    buttonsContainer.prepend(aiButton);
    aiButton.addEventListener('click', () => {
        aiButton.innerText = 'Đang tạo...';
        aiButton.style.opacity = '0.7';
        aiButton.disabled = true;
        sendMessagePromise({ action: 'createComment', url: window.location.href, timestamp: getVideoTimestamp() })
            .then(response => {
                const commentBox = document.querySelector('ytd-commentbox #contenteditable-root');
                if (commentBox) {
                    commentBox.innerText = response.comment;
                    commentBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                }
            })
            .catch(error => alert(`Lỗi khi tạo bình luận: ${error.message}`))
            .finally(() => {
                aiButton.innerText = 'Bình luận AI';
                aiButton.style.opacity = '1';
                aiButton.disabled = false;
            });
    });
}

function injectAIReplyButtons() {
    document.querySelectorAll("ytd-comment-reply-dialog-renderer").forEach(replyBox => {
        const buttonsContainer = replyBox.querySelector("#buttons");
        if (!buttonsContainer || buttonsContainer.querySelector('.ai-reply-btn-super')) return;
        const parentCommentText = replyBox.closest('ytd-comment-thread-renderer')?.querySelector('ytd-expander #content-text')?.innerText;
        if (!parentCommentText) return;
        const aiReplyBtn = document.createElement('button');
        aiReplyBtn.innerText = 'Phản hồi AI';
        aiReplyBtn.className = 'ai-reply-btn-super';
        Object.assign(aiReplyBtn.style, { backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer', marginRight: '8px', lineHeight: 'normal', transition: 'background-color .2s, opacity .2s' });
        buttonsContainer.prepend(aiReplyBtn);
        aiReplyBtn.addEventListener('click', () => {
            aiReplyBtn.innerText = 'Đang tạo...';
            aiReplyBtn.disabled = true;
            aiReplyBtn.style.opacity = '0.7';
            sendMessagePromise({ action: 'createReply', url: window.location.href, parentComment: parentCommentText, timestamp: getVideoTimestamp() })
                .then(response => {
                    const replyInput = replyBox.querySelector('#contenteditable-root');
                    if (replyInput) {
                        replyInput.innerText = response.comment;
                        replyInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    }
                })
                .catch(error => alert(`Lỗi khi tạo phản hồi: ${error.message}`))
                .finally(() => {
                    aiReplyBtn.innerText = 'Phản hồi AI';
                    aiReplyBtn.disabled = false;
                    aiReplyBtn.style.opacity = '1';
                });
        });
    });
}

// --- BỘ QUẢN LÝ VÀ KHỞI TẠO CHÍNH ---
function initialize() {
    if (observer) observer.disconnect();
    if (progressCheckInterval) clearInterval(progressCheckInterval);
    automationHasRun = false;
    currentVideoId = getVideoIdFromUrl(window.location.href);
    createOrUpdateFloatingButtons();
    observer = new MutationObserver(() => {
        injectAICommentButton();
        injectAIReplyButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (currentVideoId) {
        setupVideoProgressListener();
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ytHistoryUpdated") {
        setTimeout(initialize, 500);
    } else if (request.action === "getTimestamp") {
        sendResponse({ timestamp: getVideoTimestamp() });
    }
    return true;
});

initialize();