// Xử lý các tác vụ khi tiện ích được cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener((details) => {
    // Chỉ thực hiện khi người dùng cài đặt lần đầu tiên
    if (details.reason === 'install') {
        // 1. Thiết lập các giá trị mặc định
        chrome.storage.sync.set({
            isAutoCommentEnabled: false,
            autoPercentageMin: 30,
            autoPercentageMax: 80,
            isAutoLikeEnabled: true,
            autoLikePercentageMin: 50,
            autoLikePercentageMax: 80,
            aiLanguage: 'English',
            customPrompt: '',
            aiApiKey: '',
            accessToken: '23105d20-3812-44c9-9906-8adf1fd5e69e'
        });
        chrome.storage.local.set({ commentHistory: [], transcriptHistory: [], summaryHistory: [], likeHistory: [] });

        // 2. Mở trang hướng dẫn sử dụng trong một tab mới
        const guideUrl = "https://blogs.softty.net/tien-ich-ai-tang-tuong-tac-youtube/";
        chrome.tabs.create({ url: guideUrl });
    }
});

// Hàm lưu trữ lịch sử bình luận
function saveCommentToHistory(data) {
    chrome.storage.local.get({ commentHistory: [] }, (result) => {
        const history = result.commentHistory;
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ commentHistory: history });
    });
}

// Hàm lưu trữ lịch sử tóm tắt
function saveSummaryToHistory(data) {
    chrome.storage.local.get({ summaryHistory: [] }, (result) => {
        const history = result.summaryHistory;
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ summaryHistory: history });
    });
}

// Hàm lưu trữ lịch sử like
function saveLikeToHistory(data) {
    chrome.storage.local.get({ likeHistory: [] }, (result) => {
        const history = result.likeHistory;
        history.unshift(data);
        if (history.length > 100) {
            history.pop();
        }
        chrome.storage.local.set({ likeHistory: history });
    });
}


// Hàm gọi API chung (ĐÃ SỬA LỖI)
async function fetchFromApi(body, queryParam) {
    const settings = await chrome.storage.sync.get(['accessToken']);
    const token = settings.accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
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

    // Luôn trả về text để handler tự xử lý.
    // Điều này giúp xử lý các trường hợp API trả về lỗi dạng text thay vì JSON.
    return response.text();
}


// Lắng nghe tin nhắn từ content script hoặc popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handleMessage = async () => {
        try {
            const settings = await chrome.storage.sync.get(['aiLanguage', 'customPrompt', 'aiApiKey']);
            const baseBody = {
                url: request.url,
                language: settings.aiLanguage || 'English',
                prompt: settings.customPrompt || '',
                apiKey: settings.aiApiKey || ''
            };

            if (request.action === 'createComment' || request.action === 'createReply') {
                const requestBody = { ...baseBody, timestamp: request.timestamp };
                if (request.action === 'createReply') {
                    requestBody.comment = request.parentComment;
                }
                const commentText = await fetchFromApi(requestBody);

                if (request.action === 'createComment') {
                    saveCommentToHistory({
                        videoUrl: request.url,
                        commentContent: commentText,
                        videoTimestamp: request.timestamp,
                        realTimestamp: new Date().toISOString()
                    });
                }
                sendResponse({ success: true, content: commentText });

            } else if (request.action === 'summarizeVideo') {
                // **LOGIC SỬA LỖI BẮT ĐẦU TỪ ĐÂY**
                const responseText = await fetchFromApi(baseBody, 'summarize');
                let summaryText;

                try {
                    // Thử parse text dưới dạng JSON
                    const summaryJson = JSON.parse(responseText);
                    summaryText = summaryJson.summary;
                } catch (e) {
                    // Nếu parse lỗi, nghĩa là API đã trả về một chuỗi lỗi (ví dụ: "This video has no transcript...")
                    summaryText = responseText;
                }
                // **KẾT THÚC LOGIC SỬA LỖI**

                if (!summaryText || summaryText.includes("không có phụ đề") || summaryText.includes("No transcript")) {
                    throw new Error("Không thể tóm tắt video này vì không có lời thoại.");
                }

                saveSummaryToHistory({
                    videoUrl: request.url,
                    summaryContent: summaryText,
                    realTimestamp: new Date().toISOString()
                });

                sendResponse({ success: true, content: summaryText });

            } else if (request.action === 'getTranscriptText') {
                const responseText = await fetchFromApi(baseBody, 'transcripts');
                const transcriptData = JSON.parse(responseText); // Lời thoại thường ổn định hơn và luôn là JSON
                let rawTranscript = null;

                if (!transcriptData || transcriptData.length === 0 || transcriptData[0]?.message === 'no transcript') {
                    throw new Error("Video này không có lời thoại.");
                } else {
                    const transcriptResponse = transcriptData.find(item => item?.data?.transcripts);
                    if (transcriptResponse) {
                        const data = transcriptResponse.data;
                        const langCodeEntry = data.language_code?.[0];
                        const langCode = langCodeEntry?.code;
                        if (langCode && data.transcripts[langCode]) {
                            const transcripts = data.transcripts[langCode];
                            rawTranscript = transcripts.custom || transcripts.default || transcripts.auto;
                        }
                    }
                }

                if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
                    const fullText = rawTranscript.map(seg => seg.text).join(' ');
                    sendResponse({ success: true, content: fullText });
                } else {
                    throw new Error("Không tìm thấy nội dung lời thoại hợp lệ.");
                }

            } else if (request.action === 'openTranscriptPage') {
                await chrome.storage.local.set({ transcriptVideoUrl: request.videoUrl });
                const transcriptPageUrl = chrome.runtime.getURL('pages/transcript/transcript.html');
                await chrome.tabs.create({ url: transcriptPageUrl });

            } else if (request.action === 'isVideoInHistory') {
                const { commentHistory } = await chrome.storage.local.get({ commentHistory: [] });
                const hasValidComment = commentHistory.some(item => {
                    try {
                        return new URL(item.videoUrl).searchParams.get('v') === request.videoId && item.commentContent?.trim() !== '';
                    } catch {
                        return false;
                    }
                });
                sendResponse({ success: true, isInHistory: hasValidComment });
            } else if (request.action === 'isVideoLiked') {
                const { likeHistory } = await chrome.storage.local.get({ likeHistory: [] });
                const isLiked = likeHistory.some(item => {
                    try {
                        return new URL(item.videoUrl).searchParams.get('v') === request.videoId;
                    } catch {
                        return false;
                    }
                });
                sendResponse({ success: true, isLiked: isLiked });
            }
             else if (request.action === 'likeVideo') {
                saveLikeToHistory({
                    videoUrl: request.url,
                    realTimestamp: new Date().toISOString()
                });
                sendResponse({ success: true });
            } else if (request.action === 'getVideoInfo') {
                const responseText = await fetchFromApi(baseBody, 'infovideo');
                const videoInfo = JSON.parse(responseText);
                sendResponse({ success: true, details: videoInfo[0] });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    };

    handleMessage();
    return true;
});


// Theo dõi sự kiện điều hướng trang để thông báo cho content script
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url && details.url.includes("youtube.com/watch")) {
        chrome.tabs.sendMessage(details.tabId, { action: "ytHistoryUpdated" }).catch(err => { });
    }
});