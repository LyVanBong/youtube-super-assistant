
import { SELECTORS } from '../dom/selectors';
import { backgroundService } from '../services/backgroundService';
import { setButtonLoadingState } from '../ui/utils';
import { getVideoTimestamp } from '../utils/time';

export function injectAICommentButton(): void {
    const buttonsContainer = document.querySelector<HTMLElement>(SELECTORS.comments.aiButtonContainer);
    if (!buttonsContainer || buttonsContainer.querySelector(SELECTORS.comments.aiButton)) return;

    const aiButton = document.createElement('button');
    aiButton.innerText = 'Bình luận AI';
    aiButton.className = SELECTORS.comments.aiButton.substring(1);
    buttonsContainer.prepend(aiButton);

    aiButton.addEventListener('click', async () => {
        setButtonLoadingState(aiButton, true);
        try {
            const { content } = await backgroundService.createComment(window.location.href, getVideoTimestamp());
            const commentBox = document.querySelector<HTMLDivElement>(SELECTORS.comments.commentBox);
            if (commentBox) {
                commentBox.innerText = content;
                // Dispatch input event to make YouTube recognize the change
                commentBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            }
        } catch (error: unknown) {
            alert(`Lỗi khi tạo bình luận: ${(error as Error).message}`);
        } finally {
            setButtonLoadingState(aiButton, false);
        }
    });
}
