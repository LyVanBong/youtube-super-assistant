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

// --- BỘ ICON SVG MỚI, CHI TIẾT HƠN ---
const SVG_ICONS = {
    arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>',
    comment: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="13" y2="13"></line></svg>',
    robot: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4m0 16v-4m8-8h-4m-8 0H4m15.5 2.5l-3-3m-10 0l-3 3m10 5l3 3m-10 0l3-3"></path><circle cx="12" cy="12" r="2"></circle><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"></path></svg>',
    robotOff: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
    transcript: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h10M6 12h12M6 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    summarize: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.5 3.5 0 0 0 6.5 8c0 2.4 2 4.3 4.5 5.5A3.5 3.5 0 0 0 14.5 17c1.8 0 3.2-1.3 3.5-3 .6-.4 1-1 1-1.8 0-1.4-1.3-2.5-2.8-2.5-1 0-1.8.5-2.2 1.2-.5-.3-1-.5-1.5-.5A3.7 3.7 0 0 0 9 9.3c.4-.2.8-.3 1.2-.3a3.5 3.5 0 0 0 3.5-3.5c0-.3 0-.7-.2-1-.3-.4-.6-.8-1-1.2-1-.8-2.3-1.3-3.7-1.3z"/><path d="M20.2 18.8a2.3 2.3 0 0 0-1.2-3.8 2.3 2.3 0 0 0-3.8-1.2A2.3 2.3 0 0 0 14 15a2.3 2.3 0 0 0-1.2 3.8 2.3 2.3 0 0 0 3.8 1.2 2.3 2.3 0 0 0 3.6-1.2z"/></svg>'
};

// --- CÁC HÀM TRỢ GIÚP ---
const humanizedDelay = (ms = 1000) => new Promise(res => setTimeout(res, ms));
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
        if (!element) return reject(new Error(`Không tìm thấy phần tử: ${selector}`));
        element.scrollIntoView({ behavior: 'smooth', block: blockOption });
        let scrollTimeout;
        const scrollListener = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                window.removeEventListener('scroll', scrollListener);
                resolve(element);
            }, 150);
        };
        window.addEventListener('scroll', scrollListener);
        scrollListener();
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
function setButtonLoadingState(button, isLoading) {
    if (!button) return;
    if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML;
    }
    if (isLoading) {
        button.innerHTML = '<div class="super-assistant-loading-spinner"></div>';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalContent;
        button.disabled = false;
    }
}

function showCustomNotification(message, isError = false) {
    const notificationId = 'super-assistant-notification';
    let notification = document.getElementById(notificationId);
    if (!notification) {
        notification = document.createElement('div');
        notification.id = notificationId;
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.className = isError ? 'show error' : 'show';
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function injectStyles() {
    const styleId = 'super-assistant-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @keyframes super-assistant-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .super-assistant-loading-spinner {
            display: inline-block; width: 20px; height: 20px; border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.3); border-top-color: #FFF;
            animation: super-assistant-spin 1s linear infinite; margin: auto;
        }
        #super-assistant-fab-container {
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column-reverse; align-items: center;
        }
        #super-assistant-main-btn {
            background-color: rgba(15, 15, 15, 0.9); border: 1px solid #3f3f3f; border-radius: 50%;
            width: 56px; height: 56px; cursor: pointer; display: flex; align-items: center;
            justify-content: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease; padding: 0; margin-top: 15px;
        }
        #super-assistant-main-btn img {
            width: 32px; height: 32px; transition: transform 0.3s ease-in-out;
        }

        /* --- GIẢI PHÁP JS + CSS --- */
        #super-assistant-actions-menu {
            display: flex; flex-direction: column; align-items: center; gap: 10px;
            visibility: hidden; opacity: 0; transform: translateY(10px);
            transition: visibility 0.2s, opacity 0.2s, transform 0.2s ease-in-out;
            pointer-events: none;
        }
        /* KHI CONTAINER CÓ CLASS 'menu-active', THÌ HIỆN MENU */
        #super-assistant-fab-container.menu-active #super-assistant-actions-menu {
            visibility: visible;
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
        /* VÀ XOAY ICON */
        #super-assistant-fab-container.menu-active #super-assistant-main-btn img {
            transform: rotate(360deg);
        }
        /* --- KẾT THÚC GIẢI PHÁP --- */

        .super-assistant-action-btn {
            background-color: rgba(15, 15, 15, 0.9); color: white; border: 1px solid #3f3f3f;
            border-radius: 50%; width: 50px; height: 50px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); transition: all 0.2s ease;
        }
        .super-assistant-action-btn:hover:not(:disabled) { transform: scale(1.1); }

        #super-assistant-notification {
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background-color: #28a745; color: white; padding: 12px 20px;
            border-radius: 8px; font-size: 14px; font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0; transform: translateY(-20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        #super-assistant-notification.show { opacity: 1; transform: translateY(0); }
        #super-assistant-notification.error { background-color: #dc3545; }
    `;
    document.head.appendChild(style);
}

// --- CÁC HÀM LOGIC CHÍNH ---
function handleGetTranscriptClick() {
    chrome.runtime.sendMessage({
        action: 'openTranscriptPage',
        videoUrl: window.location.href
    });
}
async function runFullAutomation(expectedVideoId, commentContent = null) {
    const checkContext = () => { if (getVideoIdFromUrl(window.location.href) !== expectedVideoId) throw new Error('Bối cảnh trang đã thay đổi, dừng tự động.'); };
    try {
        console.log('[Super Assistant] Bắt đầu chuỗi tự động cho video:', expectedVideoId);
        checkContext();
        const commentBox = await scrollToElement('ytd-comments#comments');
        await humanizedDelay(500);
        checkContext();

        const placeholder = commentBox.querySelector('ytd-comment-simplebox-renderer #placeholder-area');
        if (placeholder) placeholder.click();
        await humanizedDelay(500);
        checkContext();

        let finalComment = commentContent;
        if (!finalComment) {
            const response = await sendMessagePromise({ action: 'createComment', url: window.location.href, timestamp: getVideoTimestamp() });
            finalComment = response.content;
        }

        checkContext();
        const editableDiv = document.querySelector('ytd-commentbox #contenteditable-root');
        if (!editableDiv) throw new Error('Không tìm thấy ô nhập bình luận.');
        editableDiv.innerText = finalComment;
        editableDiv.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        await humanizedDelay(500);
        checkContext();

        const submitButton = document.querySelector('ytd-commentbox #submit-button button:not([disabled])');
        if (!submitButton) throw new Error('Không tìm thấy nút gửi bình luận.');
        submitButton.click();

        console.log('[Super Assistant] Đã gửi bình luận!');
    } catch (error) {
        console.warn('[Super Assistant] Lỗi trong chuỗi tự động:', error.message);
    }
}

function setupVideoProgressListener() {
    if (progressCheckInterval) clearInterval(progressCheckInterval);
    const video = document.querySelector('video.html5-main-video');
    if (!video) return;

    chrome.storage.sync.get({ isAutoCommentEnabled: true, autoPercentageMin: 30, autoPercentageMax: 80 }, (settings) => {
        if (!settings.isAutoCommentEnabled) return;

        const min = settings.autoPercentageMin / 100;
        const max = settings.autoPercentageMax / 100;
        const activationThreshold = Math.random() * (max - min) + min;
        console.log(`[Super Assistant] Ngưỡng kích hoạt ngẫu nhiên: ${(activationThreshold * 100).toFixed(2)}%`);

        progressCheckInterval = setInterval(() => {
            const isAdShowing = document.querySelector('.ad-showing');
            if (isAdShowing) {
                console.log('[Super Assistant] Phát hiện quảng cáo, tạm dừng kiểm tra.');
                const adSkipButton = document.querySelector('.ytp-ad-skip-button-container .ytp-ad-skip-button, .ytp-ad-skip-button.ytp-button');
                if (adSkipButton) adSkipButton.click();
                return;
            }

            if (video.duration && !automationHasRun && (video.currentTime / video.duration) >= activationThreshold) {
                automationHasRun = true;
                clearInterval(progressCheckInterval);
                sendMessagePromise({ action: 'isVideoInHistory', videoId: currentVideoId })
                    .then(response => {
                        if (!response.isInHistory) {
                            runFullAutomation(currentVideoId, null).then(() => {
                                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 2000);
                            });
                        } else {
                            console.log('[Super Assistant] Video đã có trong lịch sử, bỏ qua tự động.');
                        }
                    }).catch(err => runFullAutomation(currentVideoId, null));
            }
        }, 3000);
    });
}
// --- CÁC HÀM CHÈN GIAO DIỆN (UI INJECTION) ---
function createOrUpdateFloatingButtons() {
    const isWatchPage = window.location.href.includes('/watch');
    const containerId = 'super-assistant-fab-container';
    let container = document.getElementById(containerId);

    if (isWatchPage) {
        if (!container) {
            injectStyles();
            container = document.createElement('div');
            container.id = containerId;

            const mainButton = document.createElement('button');
            mainButton.id = 'super-assistant-main-btn';
            mainButton.innerHTML = `<img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="SA">`;

            const actionsMenu = document.createElement('div');
            actionsMenu.id = 'super-assistant-actions-menu';

            const createButton = (icon, title, onClick, id) => {
                const btn = document.createElement('button');
                btn.innerHTML = icon;
                btn.title = title;
                btn.className = 'super-assistant-action-btn';
                if (id) btn.id = id;
                btn.addEventListener('click', () => onClick(btn));
                return btn;
            };

            const scrollToTopBtn = createButton(SVG_ICONS.arrowUp, 'Cuộn lên trên', btn => {
                setButtonLoadingState(btn, true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setButtonLoadingState(btn, false), 1000);
            });
            const scrollToCommentBtn = createButton(SVG_ICONS.comment, 'Cuộn đến bình luận', btn => {
                setButtonLoadingState(btn, true);
                scrollToElement('ytd-comments#comments')
                    .then(() => document.querySelector('ytd-comment-simplebox-renderer #placeholder-area')?.click())
                    .catch(console.error).finally(() => setButtonLoadingState(btn, false));
            });
            const getTranscriptBtn = createButton(SVG_ICONS.transcript, 'Xem Lời thoại', handleGetTranscriptClick);

            const summarizeBtn = createButton(SVG_ICONS.summarize, 'Tóm tắt video (AI)', async (btn) => {
                setButtonLoadingState(btn, true);
                try {
                    const response = await sendMessagePromise({ action: 'summarizeVideo', url: window.location.href });
                    navigator.clipboard.writeText(response.content);
                    showCustomNotification('Đã tóm tắt và sao chép vào clipboard!');
                } catch (error) {
                    showCustomNotification(`Lỗi: ${error.message}`, true);
                } finally {
                    setButtonLoadingState(btn, false);
                }
            });

            const autoToggleButton = createButton('', 'Bật/Tắt Tự động', () => {
                chrome.storage.sync.get('isAutoCommentEnabled', data => {
                    chrome.storage.sync.set({ isAutoCommentEnabled: !data.isAutoCommentEnabled });
                });
            }, 'super-assistant-auto-toggle-btn');

            actionsMenu.append(scrollToTopBtn, scrollToCommentBtn, getTranscriptBtn, summarizeBtn, autoToggleButton);
            
            container.append(actionsMenu, mainButton);
            document.body.appendChild(container);

            // --- PHẦN LOGIC JAVASCRIPT ĐIỀU KHIỂN HIỂN THỊ ---
            mainButton.addEventListener('mouseenter', () => {
                container.classList.add('menu-active');
            });
            container.addEventListener('mouseleave', () => {
                container.classList.remove('menu-active');
            });
            // --- KẾT THÚC LOGIC JAVASCRIPT ---
        }
        container.style.display = 'flex';
        updateAutoToggleButtonUI();
    } else {
        if (container) container.style.display = 'none';
    }
}

function updateAutoToggleButtonUI() {
    const btn = document.getElementById('super-assistant-auto-toggle-btn');
    if (!btn) return;
    chrome.storage.sync.get({ isAutoCommentEnabled: true }, data => {
        btn.innerHTML = data.isAutoCommentEnabled ? SVG_ICONS.robot : SVG_ICONS.robotOff;
        btn.style.backgroundColor = data.isAutoCommentEnabled ? '#4285F4' : 'rgba(15, 15, 15, 0.9)';
    });
}
function injectAICommentButton() {
    const buttonsContainer = document.querySelector("ytd-commentbox #buttons");
    if (!buttonsContainer || buttonsContainer.querySelector('.ai-comment-btn-super')) return;

    const aiButton = document.createElement('button');
    aiButton.innerText = 'Bình luận AI';
    aiButton.className = 'ai-comment-btn-super';
    Object.assign(aiButton.style, { backgroundColor: '#065fd4', color: 'white', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer', marginRight: '8px' });

    buttonsContainer.prepend(aiButton);

    aiButton.addEventListener('click', async () => {
        setButtonLoadingState(aiButton, true);
        try {
            const response = await sendMessagePromise({ action: 'createComment', url: window.location.href, timestamp: getVideoTimestamp() });
            const commentBox = document.querySelector('ytd-commentbox #contenteditable-root');
            if (commentBox) {
                commentBox.innerText = response.content;
                commentBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            }
        } catch (error) {
            alert(`Lỗi khi tạo bình luận: ${error.message}`);
        } finally {
            setButtonLoadingState(aiButton, false);
        }
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
        Object.assign(aiReplyBtn.style, { backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer', marginRight: '8px' });

        buttonsContainer.prepend(aiReplyBtn);

        aiReplyBtn.addEventListener('click', async () => {
            setButtonLoadingState(aiReplyBtn, true);
            try {
                const response = await sendMessagePromise({ action: 'createReply', url: window.location.href, parentComment: parentCommentText, timestamp: getVideoTimestamp() });
                const replyInput = replyBox.querySelector('#contenteditable-root');
                if (replyInput) {
                    replyInput.innerText = response.content;
                    replyInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                }
            } catch (error) {
                alert(`Lỗi khi tạo phản hồi: ${error.message}`);
            } finally {
                setButtonLoadingState(aiReplyBtn, false);
            }
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
    } else if (request.action === "commentNow") {
        runFullAutomation(getVideoIdFromUrl(window.location.href), request.content)
            .catch(err => alert(`Không thể tự động bình luận: ${err.message}`));
    }
    return true;
});

// Lắng nghe thay đổi cài đặt để cập nhật nút toggle
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.isAutoCommentEnabled) {
        updateAutoToggleButtonUI();
    }
});

initialize();