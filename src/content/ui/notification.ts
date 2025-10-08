
import { SELECTORS } from '../dom/selectors';

let notificationTimer: NodeJS.Timeout | null = null;

/**
 * Displays a custom notification on the screen.
 * @param message The message to display.
 * @param isError If true, the notification will have an error style.
 */
export function showCustomNotification(message: string, isError = false): void {
    const notificationId = SELECTORS.notification.substring(1); // Get ID without '#'
    let notification = document.getElementById(notificationId);

    if (!notification) {
        notification = document.createElement('div');
        notification.id = notificationId;
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = isError ? 'show error' : 'show';

    if (notificationTimer) {
        clearTimeout(notificationTimer);
    }

    notificationTimer = setTimeout(() => {
        notification?.classList.remove('show');
    }, 4000);
}
