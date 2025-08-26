console.log('[Auto Commenter] Content script đã được tải (Chế độ theo dõi giao diện).');

// Hàm tạo và chèn nút, không có gì thay đổi.
const injectButton = () => {
    // Chúng ta nhắm vào khu vực #buttons, nơi chứa nút #submit-button
    const commentButtonContainer = document.querySelector("ytd-commentbox #buttons");

    // Nếu không tìm thấy khu vực hoặc nút đã tồn tại, dừng lại.
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
    
    // Chèn nút của chúng ta vào trước nút đầu tiên trong khu vực đó
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

// === BỘ QUAN SÁT THAY ĐỔI TRÊN TRANG ===
// Nó sẽ theo dõi toàn bộ trang để phát hiện khi nào các phần tử mới được thêm vào.
const observer = new MutationObserver((mutationsList, observer) => {
    // Lặp qua danh sách các thay đổi
    for (const mutation of mutationsList) {
        // Chúng ta chỉ quan tâm đến việc các node (phần tử) được thêm vào
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Kiểm tra xem nút "Bình luận" mặc định (#submit-button) đã xuất hiện trong DOM chưa
            if (document.querySelector('ytd-commentbox #submit-button')) {
                // Nếu tìm thấy, hãy thử chèn nút của chúng ta
                injectButton();
            }
        }
    }
});

// Bắt đầu quan sát: theo dõi sự thay đổi của các phần tử con trên toàn bộ body
observer.observe(document.body, {
    childList: true, // Theo dõi việc thêm/xóa các phần tử con
    subtree: true    // Theo dõi cả các phần tử con lồng sâu bên trong
});