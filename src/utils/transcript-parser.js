
/**
 * @module transcript-parser
 * Chứa logic để xử lý và trích xuất văn bản từ dữ liệu lời thoại thô do API trả về.
 */

/**
 * Phân tích dữ liệu lời thoại từ API và trả về một chuỗi văn bản đầy đủ.
 * Ném ra lỗi nếu dữ liệu không hợp lệ hoặc không có lời thoại.
 * @param {string} responseText - Chuỗi JSON thô từ API.
 * @returns {string} - Chuỗi văn bản lời thoại đã được xử lý.
 */
export function parseTranscript(responseText) {
    const transcriptData = JSON.parse(responseText);

    if (!Array.isArray(transcriptData) || transcriptData.length === 0) {
        throw new Error("Video này không có lời thoại hoặc định dạng dữ liệu không đúng.");
    }

    if (transcriptData[0]?.message === 'no transcript') {
        throw new Error("Video này không có lời thoại.");
    }

    let rawTranscript = null;
    const transcriptResponse = transcriptData.find(item => item?.data?.transcripts);

    if (transcriptResponse && transcriptResponse.data) {
        const data = transcriptResponse.data;
        const langCodeEntry = data.language_code?.[0];
        const langCode = langCodeEntry?.code;

        if (langCode && data.transcripts && data.transcripts[langCode]) {
            const transcripts = data.transcripts[langCode];
            // Ưu tiên lấy lời thoại do người dùng tạo, sau đó đến mặc định, cuối cùng là tự động
            rawTranscript = transcripts.custom || transcripts.default || transcripts.auto;
        }
    }

    if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
        return rawTranscript.map(seg => seg.text).join(' ');
    }

    throw new Error("Không tìm thấy nội dung lời thoại hợp lệ.");
}
