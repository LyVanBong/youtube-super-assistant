
/**
 * @module history
 * Chứa các hàm tiện ích để quản lý việc lưu và kiểm tra lịch sử hành động.
 */

/**
 * Lưu một bình luận vào lịch sử.
 * @param {object} data - Dữ liệu bình luận cần lưu.
 */
export function saveCommentToHistory(data) {
    chrome.storage.local.get({ commentHistory: [] }, (result) => {
        const history = result.commentHistory;
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ commentHistory: history });
    });
}

/**
 * Lưu một bản tóm tắt vào lịch sử.
 * @param {object} data - Dữ liệu tóm tắt cần lưu.
 */
export function saveSummaryToHistory(data) {
    chrome.storage.local.get({ summaryHistory: [] }, (result) => {
        const history = result.summaryHistory;
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ summaryHistory: history });
    });
}

/**
 * Lưu một lượt thích video vào lịch sử.
 * @param {object} data - Dữ liệu lượt thích cần lưu.
 */
export function saveLikeToHistory(data) {
    chrome.storage.local.get({ likeHistory: [] }, (result) => {
        const history = result.likeHistory;
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ likeHistory: history });
    });
}

/**
 * Kiểm tra xem một video ID đã có trong lịch sử bình luận hợp lệ hay chưa.
 * @param {string} videoId - ID của video cần kiểm tra.
 * @param {Array<object>} commentHistory - Mảng lịch sử bình luận.
 * @returns {boolean} - True nếu video đã có trong lịch sử.
 */
export function isVideoInCommentHistory(videoId, commentHistory) {
    if (!videoId || !Array.isArray(commentHistory)) {
        return false;
    }
    return commentHistory.some(item => {
        try {
            // Chỉ tính là có trong lịch sử nếu bình luận không rỗng
            const hasValidComment = item.commentContent?.trim() !== '';
            const itemVideoId = new URL(item.videoUrl).searchParams.get('v');
            return itemVideoId === videoId && hasValidComment;
        } catch (e) {
            return false;
        }
    });
}

/**
 * Kiểm tra xem một video ID đã có trong lịch sử "thích" hay chưa.
 * @param {string} videoId - ID của video cần kiểm tra.
 * @param {Array<object>} likeHistory - Mảng lịch sử thích.
 * @returns {boolean} - True nếu video đã có trong lịch sử.
 */
export function isVideoInLikeHistory(videoId, likeHistory) {
    if (!videoId || !Array.isArray(likeHistory)) {
        return false;
    }
    return likeHistory.some(item => {
        try {
            const itemVideoId = new URL(item.videoUrl).searchParams.get('v');
            return itemVideoId === videoId;
        } catch (e) {
            return false;
        }
    });
}
