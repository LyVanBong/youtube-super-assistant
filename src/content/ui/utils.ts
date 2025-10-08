
/**
 * Toggles the loading state of a button, saving its original content.
 * @param button The button element.
 * @param isLoading Whether to show the loading spinner.
 */
export function setButtonLoadingState(button: HTMLButtonElement | null, isLoading: boolean): void {
    if (!button) return;

    if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML;
    }

    if (isLoading) {
        button.innerHTML = '<div class="super-assistant-loading-spinner"></div>';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalContent || '';
        button.disabled = false;
    }
}
