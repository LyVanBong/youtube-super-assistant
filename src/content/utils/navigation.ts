
/**
 * Extracts the video ID from a YouTube URL.
 * @param url The URL to parse.
 * @returns The video ID or null if not found.
 */
export function getVideoIdFromUrl(url: string): string | null {
    try {
        return new URLSearchParams(new URL(url).search).get('v');
    } catch (e) {
        return null;
    }
}

/**
 * Scrolls an element into view smoothly.
 * @param selector The CSS selector for the element.
 * @param blockOption The vertical alignment.
 * @returns A promise that resolves with the element once scrolling is likely complete.
 */
export function scrollToElement(selector: string, blockOption: ScrollLogicalPosition = 'center'): Promise<Element> {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (!element) {
            return reject(new Error(`Element not found: ${selector}`));
        }

        element.scrollIntoView({ behavior: 'smooth', block: blockOption });

        // Resolve after a short delay to allow the smooth scroll to finish.
        // A more robust solution might use IntersectionObserver, but this is simpler.
        setTimeout(() => resolve(element), 1000);
    });
}
