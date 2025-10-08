
// Centralized CSS selectors for DOM manipulation to avoid magic strings.
export const SELECTORS = {
    video: 'video.html5-main-video',
    adShowing: '.ad-showing',
    skipAdButton: '.ytp-ad-skip-button-container .ytp-ad-skip-button, .ytp-ad-skip-button.ytp-button',
    likeButton: 'like-button-view-model button',
    comments: {
        section: 'ytd-comments#comments',
        placeholder: 'ytd-comment-simplebox-renderer #placeholder-area',
        commentBox: 'ytd-commentbox #contenteditable-root',
        submitButton: 'ytd-commentbox #submit-button button:not([disabled])',
        aiButtonContainer: 'ytd-commentbox #buttons',
        aiButton: '.ai-comment-btn-super'
    },
    reply: {
        replyBox: 'ytd-comment-reply-dialog-renderer',
        aiButtonContainer: '#buttons',
        aiButton: '.ai-reply-btn-super',
        parentCommentThread: 'ytd-comment-thread-renderer',
        parentCommentText: 'ytd-expander #content-text',
        input: '#contenteditable-root'
    },
    fab: {
        container: '#super-assistant-fab-container',
        mainButton: '#super-assistant-main-btn',
        actionsMenu: '#super-assistant-actions-menu',
        autoToggleButton: '#super-assistant-auto-toggle-btn'
    },
    notification: '#super-assistant-notification',
    updateBanner: '#sa-update-banner'
};
