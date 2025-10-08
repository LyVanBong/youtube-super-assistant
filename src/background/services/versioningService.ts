
import * as versioning from '../../shared/api/versioning';

export async function handlePageNavigation(tabId: number): Promise<void> {
    await versioning.handleVersionCheck();
    await versioning.checkAndShowBanner(tabId);
}

export async function handleHistoryUpdate(tabId: number): Promise<void> {
    await versioning.checkAndShowBanner(tabId);
    // The message sending part is better kept in the main listener to avoid circular dependencies
    // if services ever need to send messages themselves.
    chrome.tabs.sendMessage(tabId, { action: "ytHistoryUpdated" }).catch(err => { 
        // Suppress "no receiving end" error if the content script is not ready
    });
}
