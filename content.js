/**
 * YouTube Super Assistant - Content Script
 * -----------------------------------------
 * Chịu trách nhiệm chèn giao diện người dùng vào trang YouTube,
 * quản lý các hành động tự động và giao tiếp với background script.
 */

console.log('[Super Assistant] Content script đã được tải và sẵn sàng.');

// --- BIẾN TOÀN CỤC ---
let observer; // MutationObserver để theo dõi thay đổi trên trang
let automationHasRun = false; // Cờ để đảm bảo tự động chỉ chạy một lần mỗi video
let progressCheckInterval; // Interval để theo dõi tiến độ video
let currentVideoId = null; // ID của video đang xem

// --- BỘ ICON SVG CHUYÊN NGHIỆP ---
const SVG_ICONS = {
    arrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
    comment: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    robot: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4m0 16v-4m8-8h-4m-8 0H4m15.5 2.5l-3-3m-10 0l-3 3m10 5l3 3m-10 0l3-3"/><circle cx="12" cy="12" r="2"/><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/></svg>`,
    robotOff: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`
};


// --- CÁC HÀM TRỢ GIÚP (HELPER FUNCTIONS) ---
const humanizedDelay = (min = 800, max = 1600) => new Promise(res => setTimeout(res, Math.random() * (max - min) + min));

function getVideoIdFromUrl(url) {
    try {
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('v');
    } catch (e) { return null; }
}

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
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
            }
            if (response && response.success) {
                return resolve(response);
            }
            reject(new Error(response ? response.error : 'Phản hồi không thành công.'));
        });
    });
}


// --- CHUỖI HÀNH ĐỘNG TỰ ĐỘNG ---
async function runFullAutomation(expectedVideoId) {
    const checkContext = () => {
        if (getVideoIdFromUrl(window.location.href) !== expectedVideoId) {
            throw new Error('Page context changed.');
        }
    };
    try {
        console.log('[Super Assistant] Bắt đầu chuỗi tự động cho video:', expectedVideoId);
        checkContext();
        await scrollToElement('ytd-comments#comments');
        await humanizedDelay();
        checkContext();
        const placeholder = await waitForElement('ytd-comment-simplebox-renderer #placeholder-area');
        placeholder.click();
        checkContext();
        const timestamp = getVideoTimestamp();
        const response = await sendMessagePromise({ action: 'createComment', url: window.location.href, timestamp: timestamp });
        checkContext();
        const commentBox = await waitForElement('ytd-commentbox #contenteditable-root');
        commentBox.innerText = response.comment;
        commentBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        await humanizedDelay();
        checkContext();
        const submitButton = await waitForElement('ytd-commentbox #submit-button button:not([disabled])');
        submitButton.click();
        await humanizedDelay(2500, 4000);
        checkContext();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[Super Assistant] Hoàn tất chuỗi hành động!');
    } catch (error) {
        if (error.message.includes('Page context changed')) {
            console.log('[Super Assistant] Tự động dừng do người dùng đã chuyển video.');
        } else {
            console.error('[Super Assistant] Lỗi trong chuỗi tự động:', error);
        }
    }
}


// --- **PHẦN CẬP NHẬT QUAN TRỌNG** ---
// --- BỘ KÍCH HOẠT TỰ ĐỘNG ---
async function setupVideoProgressListener() {
    if (progressCheckInterval) clearInterval(progressCheckInterval);
    try {
        const video = await waitForElement('video.html5-main-video', 10000);

        // Lấy các cài đặt từ storage
        const defaults = { 
            isAutoCommentEnabled: true, 
            autoPercentageMin: 30, 
            autoPercentageMax: 80 
        };

        chrome.storage.sync.get(defaults, (settings) => {
            // **Điều kiện 1: Kiểm tra xem tính năng có được bật không**
            if (settings.isAutoCommentEnabled === false) {
                console.log('[Super Assistant] Tự động bình luận đang tắt. Bỏ qua.');
                return;
            }

            // **Điều kiện 2: Sinh ra một số ngẫu nhiên trong khoảng**
            const min = settings.autoPercentageMin / 100;
            const max = settings.autoPercentageMax / 100;
            const activationThreshold = Math.random() * (max - min) + min; // Tạo số ngẫu nhiên, ví dụ: 0.5 (tức 50%)

            console.log(`[Super Assistant] Ngưỡng kích hoạt ngẫu nhiên được đặt là: ${(activationThreshold * 100).toFixed(2)}%`);

            progressCheckInterval = setInterval(() => {
                // Bỏ qua quảng cáo
                document.querySelector('.ytp-ad-skip-button-container .ytp-ad-skip-button, .ytp-ad-skip-button.ytp-button')?.click();

                if (video && video.duration && !automationHasRun) {
                    // **Điều kiện 3: Kích hoạt khi video đạt đến ngưỡng ngẫu nhiên**
                    if ((video.currentTime / video.duration) >= activationThreshold) {
                        automationHasRun = true;
                        clearInterval(progressCheckInterval);

                        chrome.runtime.sendMessage({ action: 'isVideoInHistory', videoId: currentVideoId }, (response) => {
                            if (chrome.runtime.lastError || (response && !response.isInHistory)) {
                                console.log('[Super Assistant] Video chưa có trong lịch sử. Bắt đầu chuỗi tự động.');
                                runFullAutomation(currentVideoId);
                            } else {
                                console.log('[Super Assistant] Video đã có trong lịch sử. Bỏ qua tự động bình luận.');
                            }
                        });
                    }
                }
            }, 3000); // Kiểm tra mỗi 3 giây
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
            container = document.createElement('div');
            container.id = containerId;
            Object.assign(container.style, { position: 'fixed', bottom: '30px', right: '30px', zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '10px' });
            
            const buttonStyles = { backgroundColor: 'rgba(15, 15, 15, 0.9)', color: 'white', border: '1px solid #3f3f3f', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', transition: 'transform 0.2s ease, background-color 0.2s' };

            const createButton = (icon, title, onClick) => {
                const btn = document.createElement('button');
                btn.innerHTML = icon;
                btn.title = title;
                Object.assign(btn.style, buttonStyles);
                btn.addEventListener('click', onClick);
                btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
                btn.onmouseout = () => btn.style.transform = 'scale(1.0)';
                return btn;
            };

            const scrollToTopBtn = createButton(SVG_ICONS.arrowUp, 'Cuộn lên trên cùng', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            
            const scrollToCommentBtn = createButton(SVG_ICONS.comment, 'Cuộn đến bình luận', () => {
                scrollToElement('ytd-comments#comments').then(() => {
                    setTimeout(() => document.querySelector('ytd-comment-simplebox-renderer #placeholder-area')?.click(), 500);
                }).catch(console.error);
            });

            const autoToggleButton = createButton('', 'Bật/Tắt Tự động Bình luận', () => {
                 chrome.storage.sync.get('isAutoCommentEnabled', (data) => {
                    const newIsEnabled = !(data.isAutoCommentEnabled !== false);
                    chrome.storage.sync.set({ isAutoCommentEnabled: newIsEnabled });
                });
            });
            
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

            container.append(scrollToTopBtn, scrollToCommentBtn, autoToggleButton);
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
    Object.assign(aiButton.style, {
        backgroundColor: 'var(--yt-spec-brand-button-background, #065fd4)', color: 'var(--yt-spec-static-brand-white, white)',
        border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '500', borderRadius: '18px',
        cursor: 'pointer', marginRight: '8px', lineHeight: 'normal', transition: 'background-color .2s, opacity .2s'
    });
    buttonsContainer.prepend(aiButton);

    aiButton.addEventListener('click', () => {
        aiButton.innerText = 'Đang tạo...';
        aiButton.style.opacity = '0.7';
        aiButton.disabled = true;
        const timestamp = getVideoTimestamp();
        sendMessagePromise({ action: 'createComment', url: window.location.href, timestamp: timestamp })
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
        Object.assign(aiReplyBtn.style, {
            backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '10px 16px', fontSize: '14px',
            fontWeight: '500', borderRadius: '18px', cursor: 'pointer', marginRight: '8px',
            lineHeight: 'normal', transition: 'background-color .2s, opacity .2s'
        });
        buttonsContainer.prepend(aiReplyBtn);

        aiReplyBtn.addEventListener('click', () => {
            aiReplyBtn.innerText = 'Đang tạo...';
            aiReplyBtn.disabled = true;
            aiReplyBtn.style.opacity = '0.7';
            
            const timestamp = getVideoTimestamp();
            sendMessagePromise({ action: 'createReply', url: window.location.href, parentComment: parentCommentText, timestamp: timestamp })
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

// Chạy lần đầu
initialize();