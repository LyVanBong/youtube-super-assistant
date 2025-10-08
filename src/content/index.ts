import './content.css';
import { observeForAddedNodes } from './dom/observer';
import { SELECTORS } from './dom/selectors';
import { injectAICommentButton } from './features/aiCommentButton';
import { injectAIReplyButtons } from './features/aiReplyButton';
import { resetAutoActionsState, setupVideoProgressListener, runManualCommentAutomation } from './features/autoActions';
import { createOrUpdateFabMenu } from './features/fabMenu';
import { displayUpdateBanner } from './features/updateBanner';
import { getVideoIdFromUrl } from './utils/navigation';

console.log('[Super Assistant] Content script refactored and loaded.');

let mainObserver: MutationObserver | null = null;

/**
 * Main initialization function. 
 * Sets up the UI and listeners for the current page context.
 */
function initialize(): void {
    // 1. Reset state from previous page
    if (mainObserver) mainObserver.disconnect();
    resetAutoActionsState();

    // 2. Set up UI elements that are always present or conditional
    createOrUpdateFabMenu();

    const currentVideoId = getVideoIdFromUrl(window.location.href);
    if (currentVideoId) {
        // 3. Start features specific to video pages
        setupVideoProgressListener(currentVideoId);

        // 4. Set up observer for dynamic elements like comment boxes
        mainObserver = observeForAddedNodes(SELECTORS.comments.section, () => {
            injectAICommentButton();
            injectAIReplyButtons();
        });
    }
}

// --- LISTENERS ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const currentVideoId = getVideoIdFromUrl(window.location.href);

    if (request.action === "ytHistoryUpdated") {
        // YouTube has navigated to a new page (SPA navigation)
        setTimeout(initialize, 500); // Delay to allow new page to settle
    } else if (request.action === "showUpdateBanner") {
        displayUpdateBanner(request.version);
    } else if (request.action === "commentNow" && currentVideoId) {
        runManualCommentAutomation(currentVideoId, request.content);
    }
    
    // Return true for async responses, though we don't have any in this listener now.
    return true; 
});

// --- INITIAL RUN ---

initialize();