
/**
 * @module versioning
 * Module này xử lý việc kiểm tra phiên bản mới của extension và hiển thị thông báo.
 */

/**
 * Kiểm tra xem có phiên bản mới không và hiển thị banner nếu có.
 * @param {number} tabId - ID của tab cần hiển thị banner.
 */
export async function checkAndShowBanner(tabId) {
    try {
        const { newVersionInfo, dismissedVersion } = await chrome.storage.local.get(['newVersionInfo', 'dismissedVersion']);
        if (newVersionInfo && newVersionInfo.version !== dismissedVersion) {
            chrome.tabs.sendMessage(tabId, {
                action: "showUpdateBanner",
                version: newVersionInfo.version
            }).catch(err => {
                // Bỏ qua lỗi nếu content script chưa sẵn sàng
            });
        }
    } catch (e) {
        // Bỏ qua lỗi nếu không thể truy cập storage
    }
}

/**
 * Thực hiện gọi API để kiểm tra phiên bản mới, nhưng chỉ mỗi ngày một lần.
 */
export async function handleVersionCheck() {
    const { lastVersionCheck } = await chrome.storage.local.get("lastVersionCheck");
    const oneDay = 24 * 60 * 60 * 1000;
    if (lastVersionCheck && (Date.now() - lastVersionCheck < oneDay)) {
        return;
    }

    try {
        const { accessToken } = await chrome.storage.sync.get('accessToken');
        if (!accessToken) return;

        const currentVersion = chrome.runtime.getManifest().version;
        const apiUrl = `https://workflow.softty.net/webhook/${accessToken}?current_version=${currentVersion}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'version': currentVersion },
            body: JSON.stringify({})
        });

        if (!response.ok) return;

        const data = await response.json();
        await chrome.storage.local.set({ lastVersionCheck: Date.now() });

        if (data && data.new_version) {
            await chrome.storage.local.set({ newVersionInfo: data });
            await chrome.storage.session.set({ updateNotes: data.notes });
        } else {
            await chrome.storage.local.remove(['newVersionInfo', 'dismissedVersion']);
        }
    } catch (error) {
        // Bỏ qua lỗi một cách âm thầm
    }
}
