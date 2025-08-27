console.log('[Auto Commenter] Content script đã được tải.');

// Biến toàn cục để quản lý bộ quan sát
let observer;

/**
 * Tạo hoặc cập nhật trạng thái của nút cuộn nổi.
 * Logic được sửa lại để dựa vào sự tồn tại của khu vực bình luận.
 */
function createOrUpdateScrollButton() {
    // --- THAY ĐỔI QUAN TRỌNG NHẤT NẰM Ở ĐÂY ---
    // Cách cũ, không đủ tin cậy: const isWatchPage = window.location.href.includes('/watch');
    // Cách mới, đáng tin cậy hơn: Kiểm tra sự tồn tại của phần tử.
    const commentSectionExists = document.querySelector('ytd-comments#comments');
    let scrollButton = document.getElementById('scroll-to-comments-btn');

    // 1. Nếu khu vực bình luận tồn tại
    if (commentSectionExists) {
        // Nếu nút chưa có, hãy tạo nó
        if (!scrollButton) {
            scrollButton = document.createElement('button');
            scrollButton.id = 'scroll-to-comments-btn';
            scrollButton.innerText = '💬';
            scrollButton.title = 'Cuộn đến bình luận';

            Object.assign(scrollButton.style, {
                position: 'fixed', bottom: '30px', right: '30px', zIndex: '9999',
                backgroundColor: 'rgba(15, 15, 15, 0.9)', color: 'white',
                border: '1px solid #3f3f3f', borderRadius: '50%', width: '50px',
                height: '50px', fontSize: '24px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.2s ease'
            });

            scrollButton.addEventListener('click', () => {
                // Khi click, cuộn đến chính khu vực bình luận mà chúng ta đã tìm thấy
                commentSectionExists.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            
            scrollButton.onmouseover = () => { scrollButton.style.transform = 'scale(1.1)'; };
            scrollButton.onmouseout = () => { scrollButton.style.transform = 'scale(1.0)'; };

            document.body.appendChild(scrollButton);
            console.log('[Auto Commenter] Nút cuộn đã được thêm.');
        }
        // Luôn đảm bảo nút được hiển thị
        scrollButton.style.display = 'flex';
    } 
    // 2. Nếu khu vực bình luận không tồn tại
    else {
        // Ẩn nút đi nếu nó đang hiển thị
        if (scrollButton) {
            scrollButton.style.display = 'none';
        }
    }
}

/**
 * Chèn nút "Bình luận AI"
 */
function injectAIButton() {
    const commentButtonContainer = document.querySelector("ytd-commentbox #buttons");
    if (!commentButtonContainer || document.getElementById('auto-comment-btn-ai')) {
        return;
    }
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
    if (observer) {
        observer.disconnect();
    }
    console.log('[Auto Commenter] Khởi tạo các chức năng cho trang...');
    
    // Luôn chạy hàm kiểm tra nút cuộn mỗi khi khởi tạo
    createOrUpdateScrollButton();

    observer = new MutationObserver(() => {
        // Mỗi khi có thay đổi, kiểm tra cả hai chức năng
        if (document.querySelector('ytd-commentbox #submit-button')) {
            injectAIButton();
        }
        // Kiểm tra lại nút cuộn phòng trường hợp khu vực comment được tải động
        createOrUpdateScrollButton();
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
        console.log('[Auto Commenter] Trang đã thay đổi, khởi tạo lại...');
        setTimeout(initialize, 500);
    }
});

// Chạy lần đầu tiên
initialize();