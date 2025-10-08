import { route } from './router';
import { BaseRequest } from './types';
import { handlePageNavigation, handleHistoryUpdate } from './services/versioningService';

// ====================================================================
// KHỞI TẠO VÀ CÀI ĐẶT
// ====================================================================

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings on installation
        chrome.storage.sync.set({
            isAutoCommentEnabled: false, autoPercentageMin: 30, autoPercentageMax: 80,
            isAutoLikeEnabled: true, autoLikePercentageMin: 50, autoLikePercentageMax: 80,
            aiLanguage: 'English', customPrompt: '', aiApiKey: '',
            accessToken: '23105d20-3812-44c9-9906-8adf1fd5e69e' // Default access token
        });
        // Initialize local storage
        chrome.storage.local.set({ commentHistory: [], transcriptHistory: [], summaryHistory: [], likeHistory: [] });
        
        // Open guide page
        const guideUrl = "https://blogs.softty.net/tien-ich-ai-tang-tuong-tac-youtube/";
        chrome.tabs.create({ url: guideUrl });
    }
    // Clear version-related info on install/update
    chrome.storage.local.remove(['lastVersionCheck', 'newVersionInfo', 'dismissedVersion']);
});

// ====================================================================
// TRÌNH LẮNG NGHE TRUNG TÂM
// ====================================================================

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request: BaseRequest, sender, sendResponse) => {
    // Use the router to handle incoming requests
    route(request, sendResponse);
    // Return true to indicate that the response will be sent asynchronously
    return true;
});

// Listen for web navigation events on YouTube pages
chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        handlePageNavigation(details.tabId);
    }
});

// Listen for history state updates (e.g., navigating between videos on YouTube)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        handleHistoryUpdate(details.tabId);
    }
});