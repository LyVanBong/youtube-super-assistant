
import { SELECTORS } from '../dom/selectors';
import { backgroundService } from '../services/backgroundService';

export function displayUpdateBanner(version: string): void {
    if (document.getElementById(SELECTORS.updateBanner.substring(1))) return;

    const banner = document.createElement('div');
    banner.id = SELECTORS.updateBanner.substring(1);
    
    banner.innerHTML = `
        <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Icon">
        <span>Super Assistant có bản cập nhật mới!</span>
    `;

    const viewButton = document.createElement('button');
    viewButton.innerText = 'Xem ngay';
    viewButton.onclick = () => backgroundService.openUpdateNotes();

    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'close-btn';
    closeButton.onclick = () => {
        backgroundService.dismissVersion(version);
        banner.remove();
    };

    banner.appendChild(viewButton);
    banner.appendChild(closeButton);
    document.body.appendChild(banner);
}
