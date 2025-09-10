console.log('[Auto Commenter] Content script đã được tải và sẵn sàng.');

// Biến toàn cục để quản lý bộ quan sát và trạng thái tự động
let observer;
let automationHasRun = false;
let progressCheckInterval;

// --- CÁC HÀM TRỢ GIÚP CHO VIỆC TỰ ĐỘNG HÓA ---
const humanizedDelay = (min = 700, max = 1500) => new Promise(res => setTimeout(res, Math.random() * (max - min) + min));

function scrollToElement(selector) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (!element) return reject(`Không tìm thấy phần tử: ${selector}`);
        const scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                resolve();
                scrollObserver.disconnect();
            }
        }, { threshold: 0.5 });
        scrollObserver.observe(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function waitForElement(selector) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            }
            if (++attempts > 30) {
                clearInterval(interval);
                reject(`Hết thời gian chờ phần tử: ${selector}`);
            }
        }, 500);
    });
}

// --- HÀM TRỢ GIÚP MỚI: Gửi tin nhắn và chờ phản hồi bằng Promise ---
function sendMessagePromise(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError.message);
            }
            if (response && response.success) {
                resolve(response);
            } else {
                reject(response ? response.error : 'Phản hồi không thành công hoặc không xác định.');
            }
        });
    });
}

// --- CHUỖI HÀNH ĐỘNG TỰ ĐỘNG CHÍNH (ĐÃ SỬA LỖI VÀ NÂNG CẤP) ---
async function runFullAutomation() {
    try {
        console.log('[Auto Commenter] Bắt đầu chuỗi hành động tự động...');
        
        await scrollToElement('ytd-comments#comments');
        console.log('[Auto Commenter] Đã cuộn đến bình luận.');
        await humanizedDelay();

        const placeholder = document.querySelector('ytd-comment-simplebox-renderer #placeholder-area');
        if (placeholder) {
            placeholder.click();
            console.log('[Auto Commenter] Đã kích hoạt ô bình luận.');
        }
        
        // --- ĐIỂM SỬA LỖI QUAN TRỌNG NHẤT ---
        // Bỏ qua việc click nút, thay vào đó gọi trực tiếp API
        console.log('[Auto Commenter] Trực tiếp gọi API để tạo bình luận...');
        const response = await sendMessagePromise({ action: 'createComment', url: window.location.href });
        
        const commentBox = await waitForElement('ytd-commentbox #contenteditable-root');
        commentBox.innerText = response.comment;
        console.log('[Auto Commenter] AI đã tạo xong bình luận.');
        
        commentBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        console.log('[Auto Commenter] Đã mô phỏng sự kiện input.');
        await humanizedDelay();

        const submitButton = document.querySelector('ytd-commentbox #submit-button button');
        if (!submitButton || submitButton.disabled) throw new Error('Không thể nhấn nút "Bình luận".');
        submitButton.click();
        console.log('[Auto Commenter] Đã nhấn nút "Bình luận".');
        
        // Bỏ qua bước chờ xác nhận không đáng tin cậy
        console.log('[Auto Commenter] Chờ một chút để bình luận được gửi đi...');
        await humanizedDelay(2500, 4000);

        await scrollToElement('#top-level-buttons-computed');
        console.log('[Auto Commenter] Đã cuộn đến nút Like.');
        await humanizedDelay();

        const likeButton = document.querySelector('#like-button button');
        if (!likeButton) throw new Error('Không tìm thấy nút Like.');
        likeButton.click();
        console.log('[Auto Commenter] Đã nhấn nút Like.');
        await humanizedDelay();

        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[Auto Commenter] Hoàn tất chuỗi hành động!');
    } catch (error) {
        console.error('[Auto Commenter] Lỗi trong chuỗi tự động:', error);
    }
}


// --- BỘ KÍCH HOẠT TỰ ĐỘNG ---
function setupVideoProgressListener() {
    if (progressCheckInterval) {
        clearInterval(progressCheckInterval);
    }
    progressCheckInterval = setInterval(() => {
        const video = document.querySelector('video.html5-main-video');
        if (video && video.duration > 0 && !automationHasRun) {
            const progress = (video.currentTime / video.duration);
            if (progress >= 0.80) {
                console.log('[Auto Commenter] Đạt 80% tiến trình video. Kích hoạt tự động...');
                automationHasRun = true;
                clearInterval(progressCheckInterval);
                runFullAutomation();
            }
        }
    }, 5000);
}


// --- CÁC HÀM CHÈN GIAO DIỆN ---
function createOrUpdateFloatingButtons() {
    const commentSectionExists = document.querySelector('ytd-comments#comments');
    const containerId = 'floating-buttons-container';
    let container = document.getElementById(containerId);
    if (commentSectionExists) {
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            Object.assign(container.style, {
                position: 'fixed', bottom: '30px', right: '30px', zIndex: '9999',
                display: 'flex', flexDirection: 'column', gap: '10px'
            });
            const buttonStyles = {
                backgroundColor: 'rgba(15, 15, 15, 0.9)', color: 'white', border: '1px solid #3f3f3f',
                borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', transition: 'transform 0.2s ease'
            };
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
                const commentSection = document.querySelector('ytd-comments#comments');
                if (!commentSection) return;
                const scrollObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            document.querySelector('ytd-comment-simplebox-renderer #placeholder-area')?.click();
                            scrollObserver.disconnect();
                        }
                    });
                }, { threshold: 0.5 });
                scrollObserver.observe(commentSection);
                commentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            scrollToCommentBtn.onmouseover = () => { scrollToCommentBtn.style.transform = 'scale(1.1)'; };
            scrollToCommentBtn.onmouseout = () => { scrollToCommentBtn.style.transform = 'scale(1.0)'; };
            container.appendChild(scrollToTopBtn);
            container.appendChild(scrollToCommentBtn);
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
    Object.assign(aiButton.style, {
        backgroundColor: '#2772db', color: 'white', border: 'none', padding: '10px 16px',
        fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer',
        marginRight: '8px', lineHeight: 'normal'
    });
    mainCommentBox.prepend(aiButton);
    aiButton.addEventListener('click', () => {
        aiButton.innerText = 'Đang tạo...';
        aiButton.disabled = true;
        sendMessagePromise({ action: 'createComment', url: window.location.href })
            .then(response => {
                const commentBox = document.querySelector('ytd-commentbox #contenteditable-root');
                if (commentBox) {
                    commentBox.innerText = response.comment;
                    commentBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                }
            })
            .catch(error => alert(`Lỗi: ${error}`))
            .finally(() => {
                aiButton.innerText = 'Bình luận AI';
                aiButton.disabled = false;
            });
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
        Object.assign(aiReplyBtn.style, {
            backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '10px 16px',
            fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer',
            marginRight: '8px', lineHeight: 'normal'
        });
        buttonsContainer.prepend(aiReplyBtn);
        aiReplyBtn.addEventListener('click', () => {
            aiReplyBtn.innerText = 'Đang tạo...';
            aiReplyBtn.disabled = true;
            sendMessagePromise({
                action: 'createReply', url: window.location.href, parentComment: parentCommentText
            })
            .then(response => {
                const replyInput = replyBox.querySelector('#contenteditable-root');
                if (replyInput) {
                    replyInput.innerText = response.comment;
                    replyInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                }
            })
            .catch(error => alert(`Lỗi: ${error}`))
            .finally(() => {
                aiReplyBtn.innerText = 'Phản hồi AI';
                aiReplyBtn.disabled = false;
            });
        });
    });
}

// --- BỘ QUẢN LÝ VÀ KHỞI TẠO CHÍNH ---
function initialize() {
    if (observer) { observer.disconnect(); }
    if (progressCheckInterval) { clearInterval(progressCheckInterval); }
    console.log('[Auto Commenter] Khởi tạo các chức năng cho trang...');
    automationHasRun = false; 
    createOrUpdateFloatingButtons();
    observer = new MutationObserver(() => {
        if (document.querySelector('ytd-commentbox #submit-button')) {
            injectAICommentButton();
        }
        injectAIReplyButtons();
        createOrUpdateFloatingButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (window.location.href.includes("/watch")) {
        setupVideoProgressListener();
    }
}

// Lắng nghe tin nhắn từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ytHistoryUpdated") {
        console.log('[Auto Commenter] Trang đã thay đổi, khởi tạo lại...');
        setTimeout(initialize, 500);
    }
    return true;
});

initialize();