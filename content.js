console.log('[Auto Commenter] Content script đã được tải.');

// Biến toàn cục để quản lý bộ quan sát
let observer;

/**
 * Tạo hoặc cập nhật trạng thái của CỤM NÚT NỔI (bao gồm cả nút lên và xuống).
 */
function createOrUpdateFloatingButtons() {
    const commentSectionExists = document.querySelector('ytd-comments#comments');
    const containerId = 'floating-buttons-container';
    let container = document.getElementById(containerId);

    if (commentSectionExists) {
        // Nếu cụm nút chưa tồn tại, hãy tạo nó
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            Object.assign(container.style, {
                position: 'fixed', bottom: '30px', right: '30px', zIndex: '9999',
                display: 'flex', flexDirection: 'column', gap: '10px'
            });

            // --- NÚT MỚI: CUỘN LÊN TRÊN CÙNG ---
            const scrollToTopBtn = document.createElement('button');
            scrollToTopBtn.innerText = '⬆️';
            scrollToTopBtn.title = 'Cuộn lên trên cùng';
            
            // Áp dụng style chung cho các nút
            const buttonStyles = {
                backgroundColor: 'rgba(15, 15, 15, 0.9)', color: 'white', border: '1px solid #3f3f3f',
                borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', transition: 'transform 0.2s ease'
            };
            Object.assign(scrollToTopBtn.style, buttonStyles);

            // Thêm sự kiện click để cuộn lên đầu trang
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            scrollToTopBtn.onmouseover = () => { scrollToTopBtn.style.transform = 'scale(1.1)'; };
            scrollToTopBtn.onmouseout = () => { scrollToTopBtn.style.transform = 'scale(1.0)'; };
            
            // --- NÚT CŨ: CUỘN XUỐNG BÌNH LUẬN ---
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
                            const placeholder = document.querySelector('ytd-comment-simplebox-renderer');
                            if (placeholder) placeholder.click();
                            scrollObserver.disconnect();
                        }
                    });
                }, { threshold: 0.5 });
                scrollObserver.observe(commentSection);
                commentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            scrollToCommentBtn.onmouseover = () => { scrollToCommentBtn.style.transform = 'scale(1.1)'; };
            scrollToCommentBtn.onmouseout = () => { scrollToCommentBtn.style.transform = 'scale(1.0)'; };

            // Thêm các nút vào cụm điều khiển
            container.appendChild(scrollToTopBtn);
            container.appendChild(scrollToCommentBtn);
            
            // Thêm cụm điều khiển vào trang
            document.body.appendChild(container);
            console.log('[Auto Commenter] Cụm nút nổi đã được thêm.');
        }
        container.style.display = 'flex';
    } else {
        if (container) {
            container.style.display = 'none';
        }
    }
}


/**
 * Chèn nút "Bình luận AI"
 */
function injectAIButton() {
    const commentButtonContainer = document.querySelector("ytd-commentbox #buttons");
    if (!commentButtonContainer || document.getElementById('auto-comment-btn-ai')) { return; }
    const aiButton = document.createElement('button');
    aiButton.innerText = 'Bình luận AI';
    aiButton.id = 'auto-comment-btn-ai';
    Object.assign(aiButton.style, {
        backgroundColor: '#2772db', color: 'white', border: 'none', padding: '10px 16px',
        fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer',
        marginRight: '8px', lineHeight: 'normal'
    });
    commentButtonContainer.prepend(aiButton);
    aiButton.addEventListener('click', () => {
        aiButton.innerText = 'Đang tạo...';
        aiButton.disabled = true;
        chrome.runtime.sendMessage({ action: 'createComment', url: window.location.href }, (response) => {
            if (response && response.success) {
                const commentBox = document.querySelector('#contenteditable-root.yt-formatted-string');
                if (commentBox) { commentBox.innerText = response.comment; }
            } else {
                alert(`Lỗi: ${response ? response.error : 'Không nhận được phản hồi.'}`);
            }
            aiButton.innerText = 'Bình luận AI';
            aiButton.disabled = false;
        });
    });
}

/**
 * Hàm khởi tạo chính
 */
function initialize() {
    if (observer) { observer.disconnect(); }
    createOrUpdateFloatingButtons();
    observer = new MutationObserver(() => {
        if (document.querySelector('ytd-commentbox #submit-button')) {
            injectAIButton();
        }
        createOrUpdateFloatingButtons();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Lắng nghe tin nhắn từ background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ytHistoryUpdated") {
        setTimeout(initialize, 500);
    }
});

// Chạy lần đầu tiên
initialize();