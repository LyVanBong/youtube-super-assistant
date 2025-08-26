console.log('[Auto Commenter] Content script đã được tải (Chế độ theo dõi giao diện).');

let observer; // Di chuyển observer ra ngoài để có thể quản lý nó

// Đóng gói toàn bộ logic khởi tạo vào một hàm
function initializeObserver() {
    // Nếu đã có một observer cũ, ngắt kết nối nó trước khi tạo cái mới
    if (observer) {
        observer.disconnect();
    }
    console.log('[Auto Commenter] Khởi tạo bộ quan sát giao diện...');

    observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                if (document.querySelector('ytd-commentbox #submit-button')) {
                    injectButton();
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function injectButton() {
    const commentButtonContainer = document.querySelector("ytd-commentbox #buttons");

    if (!commentButtonContainer || document.getElementById('auto-comment-btn-ai')) {
        return;
    }

    console.log('[Auto Commenter] Đã phát hiện nút #submit-button, đang chèn nút AI.');

    const ourButton = document.createElement('button');
    ourButton.innerText = 'Bình luận AI';
    ourButton.id = 'auto-comment-btn-ai';

    Object.assign(ourButton.style, {
        backgroundColor: '#2772db', color: 'white', border: 'none',
        padding: '10px 16px', fontSize: '14px', fontWeight: '500',
        borderRadius: '18px', cursor: 'pointer', marginRight: '8px',
        lineHeight: 'normal'
    });
    
    commentButtonContainer.prepend(ourButton);
    
    ourButton.addEventListener('click', () => {
        ourButton.innerText = 'Đang tạo...';
        ourButton.disabled = true;

        chrome.runtime.sendMessage({ action: 'createComment', url: window.location.href }, (response) => {
            if (response && response.success) {
                const commentBox = document.querySelector('#contenteditable-root.yt-formatted-string');
                if (commentBox) { commentBox.innerText = response.comment; }
            } else {
                alert(`Lỗi: ${response ? response.error : 'Không nhận được phản hồi.'}`);
            }
            ourButton.innerText = 'Bình luận AI';
            ourButton.disabled = false;
        });
    });
};

// Lắng nghe tin nhắn từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ytHistoryUpdated") {
        console.log('[Content Script] Nhận được thông báo trang đã đổi. Chạy lại logic.');
        // Khi nhận được thông báo, chạy lại hàm khởi tạo observer
        // Thêm một độ trễ nhỏ để đảm bảo DOM của trang mới đã kịp cập nhật
        setTimeout(initializeObserver, 500); 
    }
});

// Chạy lần đầu tiên khi script được tiêm vào trang
initializeObserver();