
import { SELECTORS } from '../dom/selectors';
import { SVG_ICONS } from '../ui/icons';
import { backgroundService } from '../services/backgroundService';
import { showCustomNotification } from '../ui/notification';
import { setButtonLoadingState } from '../ui/utils';
import { scrollToElement } from '../utils/navigation';

let fabContainer: HTMLElement | null = null;

function createButton(
    icon: string, 
    title: string, 
    onClick: (btn: HTMLButtonElement) => void, 
    id?: string
): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    btn.title = title;
    btn.className = 'super-assistant-action-btn';
    if (id) btn.id = id;
    btn.addEventListener('click', () => onClick(btn));
    return btn;
}

function updateAutoToggleButtonUI(): void {
    const btn = document.getElementById(SELECTORS.fab.autoToggleButton.substring(1)) as HTMLButtonElement;
    if (!btn) return;
    chrome.storage.sync.get({ isAutoCommentEnabled: true }, data => {
        btn.innerHTML = data.isAutoCommentEnabled ? SVG_ICONS.robot : SVG_ICONS.robotOff;
        btn.style.backgroundColor = data.isAutoCommentEnabled ? '#4285F4' : 'rgba(15, 15, 15, 0.9)';
    });
}

function buildMenu(): HTMLElement {
    const container = document.createElement('div');
    container.id = SELECTORS.fab.container.substring(1);

    const mainButton = document.createElement('button');
    mainButton.id = SELECTORS.fab.mainButton.substring(1);
    mainButton.innerHTML = `<img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="SA">`;

    const actionsMenu = document.createElement('div');
    actionsMenu.id = SELECTORS.fab.actionsMenu.substring(1);

    // --- Button Definitions ---
    const scrollToTopBtn = createButton(SVG_ICONS.arrowUp, 'Cuộn lên trên', btn => {
        setButtonLoadingState(btn, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setButtonLoadingState(btn, false), 1000);
    });

    const scrollToCommentBtn = createButton(SVG_ICONS.comment, 'Cuộn đến bình luận', btn => {
        setButtonLoadingState(btn, true);
        scrollToElement(SELECTORS.comments.section)
            .then(el => (el as HTMLElement).querySelector<HTMLElement>(SELECTORS.comments.placeholder)?.click())
            .catch(console.error)
            .finally(() => setButtonLoadingState(btn, false));
    });

    const getTranscriptBtn = createButton(SVG_ICONS.transcript, 'Xem Lời thoại', () => {
        backgroundService.openTranscriptPage(window.location.href);
    });

    const summarizeBtn = createButton(SVG_ICONS.summarize, 'Tóm tắt video (AI)', async (btn) => {
        setButtonLoadingState(btn, true);
        try {
            const { content } = await backgroundService.summarizeVideo(window.location.href);
            navigator.clipboard.writeText(content);
            showCustomNotification('Đã tóm tắt và sao chép vào clipboard!');
        } catch (error: unknown) {
            showCustomNotification(`Lỗi: ${(error as Error).message}`, true);
        } finally {
            setButtonLoadingState(btn, false);
        }
    });

    const autoToggleButton = createButton('', 'Bật/Tắt Tự động', () => {
        chrome.storage.sync.get('isAutoCommentEnabled', data => {
            chrome.storage.sync.set({ isAutoCommentEnabled: !data.isAutoCommentEnabled });
        });
    }, SELECTORS.fab.autoToggleButton.substring(1));

    // --- Assembly ---
    actionsMenu.append(scrollToTopBtn, scrollToCommentBtn, getTranscriptBtn, summarizeBtn, autoToggleButton);
    container.append(actionsMenu, mainButton);

    // --- Event Listeners ---
    mainButton.addEventListener('mouseenter', () => container.classList.add('menu-active'));
    container.addEventListener('mouseleave', () => container.classList.remove('menu-active'));
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.isAutoCommentEnabled) {
            updateAutoToggleButtonUI();
        }
    });

    return container;
}

export function createOrUpdateFabMenu(): void {
    const isWatchPage = window.location.href.includes('/watch');
    fabContainer = document.getElementById(SELECTORS.fab.container.substring(1));

    if (isWatchPage) {
        if (!fabContainer) {
            fabContainer = buildMenu();
            document.body.appendChild(fabContainer);
        }
        fabContainer.style.display = 'flex';
        updateAutoToggleButtonUI();
    } else {
        if (fabContainer) {
            fabContainer.style.display = 'none';
        }
    }
}
