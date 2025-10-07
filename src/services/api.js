
/**
 * @module api
 * Module này chịu trách nhiệm cho tất cả các giao tiếp với API bên ngoài.
 */

/**
 * Hàm gốc để thực hiện các yêu cầu fetch đến API.
 * @param {object} body - Nội dung của yêu cầu.
 * @param {string} [queryParam] - Tham số truy vấn đặc biệt (ví dụ: 'summarize').
 * @returns {Promise<string>} - Dữ liệu trả về từ API dưới dạng text.
 * @private
 */
async function fetchFromApi(body, queryParam) {
    const { accessToken } = await chrome.storage.sync.get('accessToken');
    const token = accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
    const API_URL = `https://workflow.softty.net/webhook/${token}${queryParam ? `?${queryParam}=true` : ''}`;
    const extensionVersion = chrome.runtime.getManifest().version;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'version': extensionVersion
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Lỗi API (${queryParam || 'comment'}): ${response.status} ${response.statusText}`);
    }
    return response.text();
}

/**
 * Gửi yêu cầu tạo bình luận hoặc trả lời bình luận.
 * @param {object} body - Dữ liệu yêu cầu.
 * @returns {Promise<string>} - Nội dung bình luận được tạo.
 */
export function generateCommentOrReply(body) {
    return fetchFromApi(body);
}

/**
 * Gửi yêu cầu tóm tắt video.
 * @param {object} body - Dữ liệu yêu cầu.
 * @returns {Promise<string>} - Nội dung tóm tắt.
 */
export function fetchSummary(body) {
    return fetchFromApi(body, 'summarize');
}

/**
 * Gửi yêu cầu lấy lời thoại video.
 * @param {object} body - Dữ liệu yêu cầu.
 * @returns {Promise<string>} - Dữ liệu lời thoại.
 */
export function fetchTranscript(body) {
    return fetchFromApi(body, 'transcripts');
}

/**
 * Gửi yêu cầu lấy thông tin video.
 * @param {object} body - Dữ liệu yêu cầu.
 * @returns {Promise<string>} - Dữ liệu thông tin video.
 */
export function fetchVideoInfo(body) {
    return fetchFromApi(body, 'infovideo');
}
