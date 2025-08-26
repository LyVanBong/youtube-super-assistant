console.log('[Auto Commenter] Content script đã được tải.');

// === HÀM CHÍNH ĐỂ TÌM VÀ CHÈN NÚT ===
const injectButton = () => {
    // Selector đến khu vực chứa nút "Bình luận" của YouTube.
    // Đây là điểm quan trọng nhất, selector này có thể thay đổi trong tương lai.
    const commentButtonContainer = document.querySelector("ytd-comment-simplebox-renderer #buttons");

    // Nếu không tìm thấy khu vực đó, dừng lại.
    if (!commentButtonContainer) {
        // console.log('[Auto Commenter] Chưa tìm thấy khu vực chèn nút.');
        return;
    }

    // Nếu nút của chúng ta đã tồn tại rồi, cũng dừng lại.
    if (document.getElementById('auto-comment-btn-ai')) {
        return;
    }

    console.log('[Auto Commenter] Đã tìm thấy khu vực chèn nút! Bắt đầu tạo nút.');

    // 1. Tạo nút bấm
    const ourButton = document.createElement('button');
    ourButton.innerText = 'Bình luận 💬';
    ourButton.id = 'auto-comment-btn-ai';

    // 2. Thêm style cho đẹp
    Object.assign(ourButton.style, {
        backgroundColor: '#2772db',
        color: 'white',
        border: 'none',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '18px',
        cursor: 'pointer',
        marginRight: '8px',
        lineHeight: 'normal'
    });
    
    // 3. Chèn nút của chúng ta vào đầu khu vực chứa các nút
    commentButtonContainer.prepend(ourButton);

    // 4. Thêm sự kiện click
    ourButton.addEventListener('click', () => {
        ourButton.innerText = 'Đang tạo...';
        ourButton.disabled = true;

        chrome.runtime.sendMessage({ action: 'createComment', url: window.location.href }, (response) => {
            if (response && response.success) {
                const commentBox = document.querySelector('#contenteditable-root');
                if (commentBox) {
                    commentBox.innerText = response.comment;
                } else {
                    alert(`Bình luận đã tạo:\n\n${response.comment}`);
                }
            } else {
                alert(`Lỗi: ${response ? response.error : 'Không nhận được phản hồi.'}`);
            }

            ourButton.innerText = 'Bình luận AI';
            ourButton.disabled = false;
        });
    });
};

// === BỘ QUAN SÁT THAY ĐỔI TRÊN TRANG ===
// MutationObserver sẽ chạy hàm injectButton() mỗi khi có thay đổi trên trang YouTube
console.log('[Auto Commenter] Bắt đầu theo dõi thay đổi trang...');
const observer = new MutationObserver((mutations) => {
    // Để tối ưu, chúng ta có thể thêm logic kiểm tra xem thay đổi có liên quan không,
    // nhưng đơn giản nhất là cứ gọi hàm chèn nút mỗi khi có thay đổi.
    injectButton();
});

// Bắt đầu quan sát toàn bộ trang, bao gồm các phần tử con được thêm/xóa
observer.observe(document.body, {
    childList: true,
    subtree: true
});