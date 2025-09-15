console.log('[Auto Commenter] Content script đã được tải và sẵn sàng.');

// Biến toàn cục để quản lý các tiến trình
let observer;
let automationHasRun = false;
let progressCheckInterval;
let currentVideoId = null;

// --- CÁC HÀM TRỢ GIÚP ---
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
    return '00:00'; // Giá trị mặc định
}

function scrollToElement(selector, blockOption = 'center') {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (!element) return reject(`Không tìm thấy phần tử: ${selector}`);
        const scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                resolve(element);
                scrollObserver.disconnect();
            }
        }, { threshold: 0.5 });
        scrollObserver.observe(element);
        element.scrollIntoView({ behavior: 'smooth', block: blockOption });
    });
}

function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const intervalTime = 500;
        const maxAttempts = timeout / intervalTime;
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            }
            if (++attempts > maxAttempts) {
                clearInterval(interval);
                reject(`Hết thời gian chờ phần tử: ${selector}`);
            }
        }, intervalTime);
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

// --- CHUỖI HÀNH ĐỘNG TỰ ĐỘNG CHÍNH ---
async function runFullAutomation(expectedVideoId) {
    const checkContext = () => { if (getVideoIdFromUrl(window.location.href) !== expectedVideoId) throw new Error('Page context changed.'); };
    try {
        console.log('[Auto Commenter] Bắt đầu chuỗi tự động cho video:', expectedVideoId);
        checkContext();
        await scrollToElement('ytd-comments#comments');
        await humanizedDelay();
        checkContext();
        document.querySelector('ytd-comment-simplebox-renderer #placeholder-area')?.click();
        
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
        await scrollToElement('ytd-watch-metadata');
        const likeButtonContainer = await waitForElement('#segmented-like-button');
        if (likeButtonContainer && likeButtonContainer.getAttribute('aria-pressed') === 'false') {
            likeButtonContainer.click();
        }
        await humanizedDelay();

        checkContext();
        await scrollToElement('ytd-watch-metadata', 'start');
        console.log('[Auto Commenter] Hoàn tất chuỗi hành động!');
    } catch (error) {
        if (error.message.includes('Page context changed')) {
            console.log('[Auto Commenter] Tự động dừng do người dùng đã chuyển video.');
        } else {
            console.error('[Auto Commenter] Lỗi trong chuỗi tự động:', error);
        }
    }
}

// --- BỘ KÍCH HOẠT TỰ ĐỘNG (ĐÃ CẬP NHẬT) ---
async function setupVideoProgressListener() {
    if (progressCheckInterval) clearInterval(progressCheckInterval);
    try {
        const video = await waitForElement('video.html5-main-video', 10000);
        chrome.storage.sync.get('isAutoCommentEnabled', (data) => {
            if (data.isAutoCommentEnabled === false) {
                console.log('[Auto Commenter] Tự động bình luận đang tắt.');
                return;
            }

            progressCheckInterval = setInterval(() => {
                // --- LOGIC KIỂM TRA QUẢNG CÁO ĐÃ SỬA LỖI ---
                const adModule = document.querySelector('.video-ads.ytp-ad-module');
                if (adModule && adModule.childElementCount > 0) {
                    // Sử dụng selector linh hoạt hơn để tìm nhiều loại nút "bỏ qua"
                    const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
                    
                    // Kiểm tra xem nút có thực sự hiển thị trên màn hình không trước khi click
                    if (skipButton && skipButton.offsetParent !== null) {
                        console.log('[Auto Commenter] Phát hiện và tự động bỏ qua quảng cáo.');
                        skipButton.click();
                    } else {
                        console.log('[Auto Commenter] Phát hiện quảng cáo, tạm dừng đếm thời gian.');
                    }
                    return; // Dừng, không kiểm tra tiến độ video
                }
                // --- KẾT THÚC SỬA LỖI ---

                if (video && video.duration && !automationHasRun) {
                    if ((video.currentTime / video.duration) >= 0.80) {
                        automationHasRun = true;
                        clearInterval(progressCheckInterval);

                        chrome.runtime.sendMessage({ action: 'isVideoInHistory', videoId: currentVideoId }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error(`Lỗi khi kiểm tra lịch sử: ${chrome.runtime.lastError.message}`);
                                runFullAutomation(currentVideoId);
                                return;
                            }
                            if (response && response.isInHistory) {
                                console.log('[Auto Commenter] Video đã có trong lịch sử. Bỏ qua tự động bình luận.');
                            } else {
                                console.log('[Auto Commenter] Video chưa có trong lịch sử. Bắt đầu chuỗi tự động.');
                                runFullAutomation(currentVideoId);
                            }
                        });
                    }
                }
            }, 3000);
        });
    } catch (error) {
        console.error('[Auto Commenter] Không tìm thấy video player để theo dõi:', error);
    }
}

// --- CÁC HÀM CHÈN GIAO DIỆN (UI) ---
function createOrUpdateFloatingButtons() {
    const isWatchPage = window.location.href.includes('/watch');
    const containerId = 'floating-buttons-container';
    let container = document.getElementById(containerId);
    if (isWatchPage) {
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            Object.assign(container.style, { position: 'fixed', bottom: '30px', right: '30px', zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '10px' });
            const buttonStyles = { backgroundColor: 'rgba(15, 15, 15, 0.9)', color: 'white', border: '1px solid #3f3f3f', borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', transition: 'transform 0.2s ease, background-color 0.2s' };
            
            const scrollToTopBtn = document.createElement('button');
            scrollToTopBtn.innerText = '⬆️';
            scrollToTopBtn.title = 'Cuộn lên trên cùng';
            Object.assign(scrollToTopBtn.style, buttonStyles);
            scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            scrollToTopBtn.onmouseover = () => { scrollToTopBtn.style.transform = 'scale(1.1)'; };
            scrollToTopBtn.onmouseout = () => { scrollToTopBtn.style.transform = 'scale(1.0)'; };
            
            const scrollToCommentBtn = document.createElement('button');
            scrollToCommentBtn.innerText = '💬';
            scrollToCommentBtn.title = 'Cuộn và Focus vào bình luận';
            Object.assign(scrollToCommentBtn.style, buttonStyles);
            scrollToCommentBtn.addEventListener('click', () => {
                const commentsElement = document.querySelector('ytd-comments#comments');
                if (commentsElement) {
                    commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => {
                        document.querySelector('ytd-comment-simplebox-renderer #placeholder-area')?.click();
                    }, 500);
                } else {
                    console.error('[Auto Commenter] Không tìm thấy khu vực bình luận để cuộn tới.');
                }
            });
            scrollToCommentBtn.onmouseover = () => { scrollToCommentBtn.style.transform = 'scale(1.1)'; };
            scrollToCommentBtn.onmouseout = () => { scrollToCommentBtn.style.transform = 'scale(1.0)'; };
            
            const autoToggleButton = document.createElement('button');
            autoToggleButton.title = 'Bật/Tắt Tự động Bình luận & Like';
            Object.assign(autoToggleButton.style, buttonStyles);
            const updateToggleButtonUI = (isEnabled) => {
                if (isEnabled) { autoToggleButton.innerText = '🤖'; autoToggleButton.style.backgroundColor = '#4285F4'; }
                else { autoToggleButton.innerText = '🚫'; autoToggleButton.style.backgroundColor = 'rgba(15, 15, 15, 0.9)'; }
            };
            chrome.storage.sync.get('isAutoCommentEnabled', (data) => {
                updateToggleButtonUI(data.isAutoCommentEnabled !== false);
            });
            autoToggleButton.addEventListener('click', () => {
                chrome.storage.sync.get('isAutoCommentEnabled', (data) => {
                    const newIsEnabled = !(data.isAutoCommentEnabled !== false);
                    chrome.storage.sync.set({ isAutoCommentEnabled: newIsEnabled }, () => {
                        updateToggleButtonUI(newIsEnabled);
                        if (newIsEnabled) {
                            automationHasRun = false; 
                            setupVideoProgressListener();
                        } else {
                            if (progressCheckInterval) clearInterval(progressCheckInterval);
                        }
                    });
                });
            });
            autoToggleButton.onmouseover = () => { autoToggleButton.style.transform = 'scale(1.1)'; };
            autoToggleButton.onmouseout = () => { autoToggleButton.style.transform = 'scale(1.0)'; };

            container.appendChild(scrollToTopBtn);
            container.appendChild(scrollToCommentBtn);
            container.appendChild(autoToggleButton);
            document.body.appendChild(container);
        }
        container.style.display = 'flex';
    } else {
        if (container) container.style.display = 'none';
    }
}

function injectAICommentButton() {
    const mainCommentBox = document.querySelector("ytd-commentbox #buttons");
    if (!mainCommentBox || mainCommentBox.querySelector('.ai-comment-btn')) { return; }
    const aiButton = document.createElement('button');
    aiButton.innerText = 'Bình luận AI';
    aiButton.className = 'ai-comment-btn';
    Object.assign(aiButton.style, { backgroundColor: '#2772db', color: 'white', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer', marginRight: '8px', lineHeight: 'normal' });
    mainCommentBox.prepend(aiButton);
    aiButton.addEventListener('click', () => {
        aiButton.innerText = 'Đang tạo...';
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
            .catch(error => alert(`Lỗi: ${error.message}`))
            .finally(() => { aiButton.innerText = 'Bình luận AI'; aiButton.disabled = false; });
    });
}

function injectAIReplyButtons() {
    const replyBoxes = document.querySelectorAll("ytd-comment-reply-dialog-renderer");
    replyBoxes.forEach(replyBox => {
        const buttonsContainer = replyBox.querySelector("#buttons");
        if (!buttonsContainer || buttonsContainer.querySelector('.ai-reply-btn')) { return; }
        const parentCommentThread = replyBox.closest('ytd-comment-thread-renderer');
        if (!parentCommentThread) return;
        const parentCommentTextElement = parentCommentThread.querySelector('ytd-expander #content-text');
        if (!parentCommentTextElement) return;
        const parentCommentText = parentCommentTextElement.innerText;
        const aiReplyBtn = document.createElement('button');
        aiReplyBtn.innerText = 'Phản hồi AI';
        aiReplyBtn.className = 'ai-reply-btn';
        Object.assign(aiReplyBtn.style, { backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer', marginRight: '8px', lineHeight: 'normal' });
        buttonsContainer.prepend(aiReplyBtn);
        aiReplyBtn.addEventListener('click', () => {
            aiReplyBtn.innerText = 'Đang tạo...';
            aiReplyBtn.disabled = true;
            const timestamp = getVideoTimestamp();
            sendMessagePromise({ action: 'createReply', url: window.location.href, parentComment: parentCommentText, timestamp: timestamp })
                .then(response => {
                    const replyInput = replyBox.querySelector('#contenteditable-root');
                    if (replyInput) {
                        replyInput.innerText = response.comment;
                        replyInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    }
                })
                .catch(error => alert(`Lỗi: ${error.message}`))
                .finally(() => { aiReplyBtn.innerText = 'Phản hồi AI'; aiReplyBtn.disabled = false; });
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
        createOrUpdateFloatingButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (currentVideoId) {
        setupVideoProgressListener();
    }
}

// Lắng nghe tin nhắn từ background script và popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ytHistoryUpdated") {
        setTimeout(initialize, 500);
    } else if (request.action === "getTimestamp") {
        sendResponse({ timestamp: getVideoTimestamp() });
    }
    return true; // Giữ kênh message mở cho các phản hồi bất đồng bộ
});

// Chạy lần đầu
initialize();