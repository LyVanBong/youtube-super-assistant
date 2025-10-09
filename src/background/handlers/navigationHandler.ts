
export async function handleOpenUpdateNotesPage(): Promise<void> {
    await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#update_notes') });
}

export async function handleUserDismissedVersion(version: string): Promise<void> {
    if (version) {
        await chrome.storage.local.set({ dismissedVersion: version });
    }
}
