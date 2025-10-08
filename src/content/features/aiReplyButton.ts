
import { SELECTORS } from '../dom/selectors';
import { backgroundService } from '../services/backgroundService';
import { setButtonLoadingState } from '../ui/utils';
import { getVideoTimestamp } from '../utils/time';

export function injectAIReplyButtons(): void {
    document.querySelectorAll<HTMLElement>(SELECTORS.reply.replyBox).forEach(replyBox => {
        const buttonsContainer = replyBox.querySelector<HTMLElement>(SELECTORS.reply.aiButtonContainer);
        if (!buttonsContainer || buttonsContainer.querySelector(SELECTORS.reply.aiButton)) return;

        const parentCommentElement = replyBox.closest(SELECTORS.reply.parentCommentThread)?.querySelector<HTMLElement>(SELECTORS.reply.parentCommentText);
        const parentCommentText = parentCommentElement?.innerText;
        if (!parentCommentText) return;

        const aiReplyBtn = document.createElement('button');
        aiReplyBtn.innerText = 'Phản hồi AI';
        aiReplyBtn.className = SELECTORS.reply.aiButton.substring(1);
        buttonsContainer.prepend(aiReplyBtn);

        aiReplyBtn.addEventListener('click', async () => {
            setButtonLoadingState(aiReplyBtn, true);
            try {
                const { content } = await backgroundService.createReply(window.location.href, parentCommentText, getVideoTimestamp());
                const replyInput = replyBox.querySelector<HTMLDivElement>(SELECTORS.reply.input);
                if (replyInput) {
                    replyInput.innerText = content;
                    replyInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                }
            } catch (error: unknown) {
                alert(`Lỗi khi tạo phản hồi: ${(error as Error).message}`);
            } finally {
                setButtonLoadingState(aiReplyBtn, false);
            }
        });
    });
}
