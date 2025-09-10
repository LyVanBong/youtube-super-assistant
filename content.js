console.log('[Auto Commenter] Content script đã được tải.');

let observer;

/**
 * Tạo hoặc cập nhật cụm nút nổi (lên/xuống).
 */
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
            // Nút cuộn lên
            const scrollToTopBtn = document.createElement('button');
            scrollToTopBtn.innerText = '⬆️';
            scrollToTopBtn.title = 'Cuộn lên trên cùng';
            Object.assign(scrollToTopBtn.style, buttonStyles);
            scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            scrollToTopBtn.onmouseover = () => { scrollToTopBtn.style.transform = 'scale(1.1)'; };
            scrollToTopBtn.onmouseout = () => { scrollToTopBtn.style.transform = 'scale(1.0)'; };
            // Nút cuộn xuống
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
            // Gắn vào container
            container.appendChild(scrollToTopBtn);
            container.appendChild(scrollToCommentBtn);
            document.body.appendChild(container);
        }
        container.style.display = 'flex';
    } else {
        if (container) container.style.display = 'none';
    }
}

/**
 * Chèn nút "Bình luận AI" vào ô bình luận chính.
 */
function injectAICommentButton() {
    const mainCommentBox = document.querySelector("ytd-commentbox #buttons");
    if (!mainCommentBox || mainCommentBox.querySelector('.ai-comment-btn')) { return; }

    const aiButton = document.createElement('button');
    aiButton.innerText = 'Bình luận AI';
    aiButton.className = 'ai-comment-btn'; // Dùng class để dễ quản lý
    Object.assign(aiButton.style, {
        backgroundColor: '#2772db', color: 'white', border: 'none', padding: '10px 16px',
        fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer',
        marginRight: '8px', lineHeight: 'normal'
    });
    mainCommentBox.prepend(aiButton);
    
    aiButton.addEventListener('click', () => {
        aiButton.innerText = 'Đang tạo...';
        aiButton.disabled = true;
        chrome.runtime.sendMessage({ action: 'createComment', url: window.location.href }, (response) => {
            if (response && response.success) {
                const commentBox = document.querySelector('ytd-commentbox #contenteditable-root');
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
 * --- CHỨC NĂNG MỚI: Chèn nút "Phản hồi AI" vào các ô trả lời ---
 */
function injectAIReplyButtons() {
    // Tìm tất cả các ô trả lời đang mở trên trang
    const replyBoxes = document.querySelectorAll("ytd-comment-reply-dialog-renderer");

    replyBoxes.forEach(replyBox => {
        const buttonsContainer = replyBox.querySelector("#buttons");
        // Nếu không có khu vực nút hoặc nút đã tồn tại, bỏ qua
        if (!buttonsContainer || buttonsContainer.querySelector('.ai-reply-btn')) {
            return;
        }

        // 1. Lấy nội dung bình luận cha
        // Đi ngược cây DOM để tìm comment thread chứa bình luận gốc
        const parentCommentThread = replyBox.closest('ytd-comment-thread-renderer');
        if (!parentCommentThread) return;

        // Tìm nội dung text của bình luận gốc
        const parentCommentTextElement = parentCommentThread.querySelector('ytd-expander #content-text');
        if (!parentCommentTextElement) return;

        const parentCommentText = parentCommentTextElement.innerText;

        // 2. Tạo và chèn nút "Phản hồi AI"
        const aiReplyBtn = document.createElement('button');
        aiReplyBtn.innerText = 'Phản hồi AI';
        aiReplyBtn.className = 'ai-reply-btn'; // Dùng class
        Object.assign(aiReplyBtn.style, {
            backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '10px 16px',
            fontSize: '14px', fontWeight: '500', borderRadius: '18px', cursor: 'pointer',
            marginRight: '8px', lineHeight: 'normal'
        });
        buttonsContainer.prepend(aiReplyBtn);

        // 3. Thêm sự kiện click
        aiReplyBtn.addEventListener('click', () => {
            aiReplyBtn.innerText = 'Đang tạo...';
            aiReplyBtn.disabled = true;

            chrome.runtime.sendMessage({
                action: 'createReply',
                url: window.location.href,
                parentComment: parentCommentText // Gửi nội dung bình luận cha
            }, (response) => {
                if (response && response.success) {
                    // Tìm ô nhập liệu bên trong ô trả lời này
                    const replyInput = replyBox.querySelector('#contenteditable-root');
                    if (replyInput) { replyInput.innerText = response.comment; }
                } else {
                    alert(`Lỗi: ${response ? response.error : 'Không nhận được phản hồi.'}`);
                }
                aiReplyBtn.innerText = 'Phản hồi AI';
                aiReplyBtn.disabled = false;
            });
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
        // Mỗi khi có thay đổi, kiểm tra tất cả các chức năng
        if (document.querySelector('ytd-commentbox #submit-button')) {
            injectAICommentButton();
        }
        // Luôn tìm kiếm các ô phản hồi mới xuất hiện
        injectAIReplyButtons();
        // Cập nhật trạng thái nút nổi
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