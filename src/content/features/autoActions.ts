import { SELECTORS } from '../dom/selectors';
import { backgroundService } from '../services/backgroundService';
import { randomizedDelay, getVideoTimestamp } from '../utils/time';
import { scrollToElement, getVideoIdFromUrl } from '../utils/navigation';

// --- State Management ---
let progressCheckInterval: NodeJS.Timeout | null = null;
let behaviorSchedule: ScheduledAction[] = [];

// --- Type Definitions ---
interface ScheduledAction {
  time: number; // The video.currentTime when the action should trigger
  action: 'seek' | 'like' | 'comment';
  targetTime?: number; // For seek actions
  hasRun: boolean;
}

interface AutoActionSettings {
  isAutoCommentEnabled: boolean;
  autoPercentageMin: number;
  autoPercentageMax: number;
  isAutoLikeEnabled: boolean;
  autoLikePercentageMin: number;
  autoLikePercentageMax: number;
}

// --- Core Automation Logic ---

/**
 * The main automation function for commenting on a video.
 * Scrolls to the comment box, types, and submits.
 */
async function runCommentAutomation(expectedVideoId: string | null, manualCommentContent?: string): Promise<void> {
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

        let finalComment = manualCommentContent;
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
        console.warn('[Super Assistant] Comment automation error:', (error as Error).message);
    }
}

/**
 * Finds and clicks the like button if the video is not already liked.
 */
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

/**
 * Seeks the video to a specific time.
 */
function performSeekAction(video: HTMLVideoElement, targetTime: number): void {
    if (video && isFinite(targetTime)) {
        console.log(`[Super Assistant] Human-like action: Seeking to ${targetTime.toFixed(0)}s`);
        video.currentTime = targetTime;
    }
}

/**
 * Skips ads if they appear.
 */
function skipAd(): void {
    if (document.querySelector(SELECTORS.adShowing)) {
        document.querySelector<HTMLElement>(SELECTORS.skipAdButton)?.click();
    }
}

/**
 * Generates a schedule of human-like actions to perform during video playback.
 */
function generateBehaviorSchedule(duration: number, settings: AutoActionSettings): ScheduledAction[] {
    const schedule: ScheduledAction[] = [];
    const addAction = (time: number, action: ScheduledAction['action'], targetTime?: number) => {
        schedule.push({ time, action, targetTime, hasRun: false });
    };

    // 1. Add seek actions
    const seekCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 seeks
    for (let i = 0; i < seekCount; i++) {
        const seekTime = duration * (Math.random() * 0.7 + 0.1); // Seek between 10% and 80%
        const seekTarget = duration * (Math.random() * 0.8 + 0.1);
        addAction(seekTime, 'seek', seekTarget);
    }
    // Add a small backward seek to simulate re-watching
    const rewatchTime = duration * (Math.random() * 0.5 + 0.2); // Between 20% and 70%
    const rewatchTarget = rewatchTime - (Math.random() * 15 + 5); // Seek back 5-20 seconds
    addAction(rewatchTime, 'seek', Math.max(0, rewatchTarget));

    // 2. Add like action
    if (settings.isAutoLikeEnabled) {
        const likeTime = duration * (Math.random() * (settings.autoLikePercentageMax / 100 - settings.autoLikePercentageMin / 100) + settings.autoLikePercentageMin / 100);
        addAction(likeTime, 'like');
    }

    // 3. Add comment action
    if (settings.isAutoCommentEnabled) {
        const commentTime = duration * (Math.random() * (settings.autoPercentageMax / 100 - settings.autoPercentageMin / 100) + settings.autoPercentageMin / 100);
        addAction(commentTime, 'comment');
    }

    // Sort schedule by time
    return schedule.sort((a, b) => a.time - b.time);
}

/**
 * Sets up the main listener that checks video progress and executes the scheduled actions.
 */
export function setupVideoProgressListener(currentVideoId: string): void {
    const video = document.querySelector<HTMLVideoElement>(SELECTORS.video);
    if (!video) return;

    chrome.storage.sync.get({ 
        isAutoCommentEnabled: true, autoPercentageMin: 30, autoPercentageMax: 80,
        isAutoLikeEnabled: true, autoLikePercentageMin: 50, autoLikePercentageMax: 80,
    }, (settings: AutoActionSettings) => {
        if (!settings.isAutoCommentEnabled && !settings.isAutoLikeEnabled) return;

        // Wait for the video duration to be available
        const waitForDuration = () => {
            if (video.duration && isFinite(video.duration)) {
                behaviorSchedule = generateBehaviorSchedule(video.duration, settings);
                console.log('[Super Assistant] Behavior schedule generated:', behaviorSchedule);
                progressCheckInterval = setInterval(() => processSchedule(video, currentVideoId), 2000);
            } else {
                setTimeout(waitForDuration, 500);
            }
        };
        waitForDuration();
    });
}

/**
 * Processes the behavior schedule, executing actions as their time comes.
 */
function processSchedule(video: HTMLVideoElement, currentVideoId: string) {
    // *** REQUIREMENT: Pause automation if tab is not active ***
    if (document.hidden) {
        console.log('[Super Assistant] Tab is hidden, pausing automation.');
        return;
    }

    if (video.paused || !video.duration) return;

    skipAd();

    const currentTime = video.currentTime;
    const nextAction = behaviorSchedule.find(a => !a.hasRun);

    if (!nextAction) {
        if (progressCheckInterval) clearInterval(progressCheckInterval);
        return;
    }

    if (currentTime >= nextAction.time) {
        nextAction.hasRun = true;
        console.log(`[Super Assistant] Executing scheduled action: ${nextAction.action}`);

        switch (nextAction.action) {
            case 'seek':
                if (nextAction.targetTime !== undefined) {
                    performSeekAction(video, nextAction.targetTime);
                }
                break;
            case 'like':
                backgroundService.isVideoLiked(currentVideoId)
                    .then(response => { if (!response.isLiked) findAndClickLikeButton(); })
                    .catch(err => console.warn('[SA] Like history check error:', err.message));
                break;
            case 'comment':
                backgroundService.isVideoInHistory(currentVideoId)
                    .then(response => { if (!response.isInHistory) runCommentAutomation(currentVideoId); })
                    .catch(err => { 
                        console.warn('[SA] Comment history check error:', err.message);
                        runCommentAutomation(currentVideoId); // Attempt to comment even if history check fails
                    });
                break;
        }
    }
}

/**
 * Clears any active intervals and resets the state.
 */
export function resetAutoActionsState(): void {
    if (progressCheckInterval) {
        clearInterval(progressCheckInterval);
        progressCheckInterval = null;
    }
    behaviorSchedule = [];
}

/**
 * Manually triggers the comment automation (e.g., from a button click).
 * This is kept separate from the main automatic behavior schedule.
 */
export function runManualCommentAutomation(currentVideoId: string, content: string): void {
    runCommentAutomation(currentVideoId, content)
        .catch((err: Error) => alert(`Không thể tự động bình luận: ${err.message}`));
}