
import { SELECTORS } from '../dom/selectors';

/**
 * Returns a promise that resolves after a random delay within a given range.
 * @param min Minimum delay in milliseconds.
 * @param max Maximum delay in milliseconds.
 */
export const randomizedDelay = (min: number, max: number): Promise<void> => 
    new Promise(res => setTimeout(res, Math.random() * (max - min) + min));

/**
 * Gets the current timestamp of the main YouTube video player.
 * @returns The timestamp in MM:SS format or '00:00' if not available.
 */
export function getVideoTimestamp(): string {
    const video = document.querySelector<HTMLVideoElement>(SELECTORS.video);
    if (video && video.currentTime) {
        const totalSeconds = Math.floor(video.currentTime);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return '00:00';
}
