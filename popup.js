document.addEventListener('DOMContentLoaded', function() {
    const createCommentBtn = document.getElementById('createCommentBtn');
    const resultDiv = document.getElementById('result');

    createCommentBtn.addEventListener('click', async () => {
        resultDiv.textContent = 'Đang xử lý...';
        createCommentBtn.disabled = true;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url || !tab.url.includes("youtube.com/watch*")) {
                throw new Error('Vui lòng mở một video YouTube.');
            }

            chrome.runtime.sendMessage(
                {
                    action: 'createComment',
                    url: tab.url 
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        resultDiv.textContent = `Lỗi: ${chrome.runtime.lastError.message}`;
                    } else if (response.success) {
                        resultDiv.textContent = `Bình luận đã tạo: ${response.comment}`;
                    } else {
                        resultDiv.textContent = `Lỗi từ API: ${response.error}`;
                    }
                    createCommentBtn.disabled = false;
                }
            );

        } catch (error) {
            resultDiv.textContent = `Lỗi: ${error.message}`;
            createCommentBtn.disabled = false;
        }
    });
});