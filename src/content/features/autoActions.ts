
import { SELECTORS } from '../dom/selectors';
import { backgroundService } from '../services/backgroundService';
import { randomizedDelay, getVideoTimestamp } from '../utils/time';
import { scrollToElement, getVideoIdFromUrl } from '../utils/navigation';

let progressCheckInterval: NodeJS.Timeout | null = null;
let automationHasRun = false;
let autoLikeHasRun = false;
let isActionInProgress = false;

async function runCommentAutomation(expectedVideoId: string | null, commentContent: string | null): Promise<void> {
    const checkContext = () => {
        if (getVideoIdFromUrl(window.location.href) !== expectedVideoId) {
            throw new Error('Page context changed during automation.');
        }
    };

    try {
        checkContext();
        await randomizedDelay(1000, 3000);
        const commentBox = await scrollToElement(SELECTORS.comments.section);
        await randomizedDelay(500, 1500);
        checkContext();

        const placeholder = (commentBox as HTMLElement).querySelector<HTMLElement>(SELECTORS.comments.placeholder);
        if (placeholder) {
            placeholder.click();
            await randomizedDelay(800, 1800);
            checkContext();
        }

        let finalComment = commentContent;
        if (!finalComment) {
            const response = await backgroundService.createComment(window.location.href, getVideoTimestamp());
            finalComment = response.content;
        }

        checkContext();
        const editableDiv = document.querySelector<HTMLDivElement>(SELECTORS.comments.commentBox);
        if (!editableDiv) throw new Error('Comment input not found.');

        const typingTime = (finalComment || '').length * (Math.random() * (30 - 15) + 15);
        await randomizedDelay(typingTime, typingTime + 500);
        
        editableDiv.innerText = finalComment || '';
        editableDiv.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        await randomizedDelay(500, 1000);
        checkContext();

        const submitButton = document.querySelector<HTMLButtonElement>(SELECTORS.comments.submitButton);
        if (!submitButton) throw new Error('Submit button not found.');

        await randomizedDelay(300, 900);
        submitButton.click();
    } catch (error: unknown) {
        console.warn('[Super Assistant] Automation error:', (error as Error).message);
        // Do not show alert for background automation
    }
}

async function findAndClickLikeButton(): Promise<void> {
    const likeButton = document.querySelector<HTMLButtonElement>(SELECTORS.likeButton);
    if (likeButton && likeButton.getAttribute('aria-pressed') === 'false') {
        try {
            await randomizedDelay(500, 2000);
            likeButton.click();
            await backgroundService.likeVideo(window.location.href);
        } catch (error: unknown) {
            console.warn('[Super Assistant] Like action error:', (error as Error).message);
        }
    }
}

function skipAd(): void {
    if (document.querySelector(SELECTORS.adShowing)) {
        document.querySelector<HTMLElement>(SELECTORS.skipAdButton)?.click();
    }
}

export function setupVideoProgressListener(currentVideoId: string): void {
    const video = document.querySelector<HTMLVideoElement>(SELECTORS.video);
    if (!video) return;

    chrome.storage.sync.get({ 
        isAutoCommentEnabled: true, autoPercentageMin: 30, autoPercentageMax: 80,
        isAutoLikeEnabled: true, autoLikePercentageMin: 50, autoLikePercentageMax: 80,
    }, (settings) => {
        if (!settings.isAutoCommentEnabled && !settings.isAutoLikeEnabled) return;

        const commentThreshold = Math.random() * (settings.autoPercentageMax / 100 - settings.autoPercentageMin / 100) + settings.autoPercentageMin / 100;
        const likeThreshold = Math.random() * (settings.autoLikePercentageMax / 100 - settings.autoLikePercentageMin / 100) + settings.autoLikePercentageMin / 100;
        
        progressCheckInterval = setInterval(() => {
            if (isActionInProgress || !video.duration || video.paused) return;

            skipAd();

            const progress = video.currentTime / video.duration;

            if (settings.isAutoLikeEnabled && !autoLikeHasRun && progress >= likeThreshold) {
                autoLikeHasRun = true;
                isActionInProgress = true;
                backgroundService.isVideoLiked(currentVideoId)
                    .then(response => { if (!response.isLiked) return findAndClickLikeButton(); })
                    .catch(err => console.warn('[SA] Like history check error:', err.message))
                    .finally(() => { isActionInProgress = false; });
            }

            if (settings.isAutoCommentEnabled && !automationHasRun && progress >= commentThreshold) {
                automationHasRun = true;
                isActionInProgress = true;
                backgroundService.isVideoInHistory(currentVideoId)
                    .then(response => { if (!response.isInHistory) return runCommentAutomation(currentVideoId, null); })
                    .catch(err => { 
                        console.warn('[SA] Comment history check error:', err.message);
                        return runCommentAutomation(currentVideoId, null); // Attempt to comment even if history check fails
                    })
                    .finally(() => { isActionInProgress = false; });
            }

            // Stop checking if all actions are done
            if ((!settings.isAutoLikeEnabled || autoLikeHasRun) && (!settings.isAutoCommentEnabled || automationHasRun)) {
                if (progressCheckInterval) clearInterval(progressCheckInterval);
            }

        }, 3000);
    });
}

export function resetAutoActionsState(): void {
    if (progressCheckInterval) {
        clearInterval(progressCheckInterval);
        progressCheckInterval = null;
    }
    automationHasRun = false;
    autoLikeHasRun = false;
    isActionInProgress = false;
}

// This function is called from the main message listener
export function runManualCommentAutomation(currentVideoId: string, content: string): void {
    runCommentAutomation(currentVideoId, content)
        .catch((err: Error) => alert(`Không thể tự động bình luận: ${err.message}`));
}
