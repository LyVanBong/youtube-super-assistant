
export async function handleOpenUpdateNotesPage(): Promise<void> {
    await chrome.tabs.create({ url: chrome.runtime.getURL('update_notes.html') });
}

export async function handleUserDismissedVersion(version: string): Promise<void> {
    if (version) {
        await chrome.storage.local.set({ dismissedVersion: version });
    }
}
