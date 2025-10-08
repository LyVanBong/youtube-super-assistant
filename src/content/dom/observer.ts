
type ObserverCallback = (element: Element) => void;

/**
 * Observes the DOM for the appearance of elements matching a selector.
 * @param selector The CSS selector to watch for.
 * @param callback The function to call when a matching element is found.
 * @param targetNode The node to observe. Defaults to document.body.
 * @param options The MutationObserver options. Defaults to { childList: true, subtree: true }.
 * @returns The MutationObserver instance.
 */
export function observeForElement( 
    selector: string, 
    callback: ObserverCallback,
    targetNode: Node = document.body,
    options: MutationObserverInit = { childList: true, subtree: true }
): MutationObserver {
    const observer = new MutationObserver((mutations, obs) => {
        const targetElement = document.querySelector(selector);
        if (targetElement) {
            callback(targetElement);
            // Optional: disconnect after finding the element if you only need it once.
            // obs.disconnect(); 
        }
    });

    observer.observe(targetNode, options);
    return observer;
}

/**
 * A more specific observer that calls the callback for each added node that matches the selector.
 * This is useful for dynamically added lists of items (like comment reply boxes).
 * @param selector The CSS selector to match against added nodes.
 * @param callback The function to call for each matching node.
 * @param targetNode The node to observe.
 * @returns The MutationObserver instance.
 */
export function observeForAddedNodes(
    selector: string,
    callback: ObserverCallback,
    targetNode: Node = document.body
): MutationObserver {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        if (element.matches(selector)) {
                            callback(element);
                        }
                        // Also check descendants of the added node
                        element.querySelectorAll(selector).forEach(callback);
                    }
                });
            }
        }
    });

    observer.observe(targetNode, { childList: true, subtree: true });
    return observer;
}
