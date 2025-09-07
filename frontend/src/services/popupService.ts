/**
 * Popup Blocker Detection Service
 * Helps detect if popup blockers are preventing authentication popups
 */

export class PopupService {
  /**
   * Test if popups are blocked by the browser
   */
  static testPopupBlocked(): boolean {
    try {
      const popup = window.open('', '_blank', 'width=1,height=1,left=-1000,top=-1000');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        return true;
      }
      popup.close();
      return false;
    } catch (error) {
      return true;
    }
  }

  /**
   * Show popup blocker warning to user
   */
  static showPopupBlockedWarning(): void {
    const message = `
Popup blocked! 

To use Google/GitHub authentication:
1. Click on the popup blocker icon in your address bar
2. Select "Always allow popups from this site"
3. Try signing in again

Or manually allow popups:
• Chrome: Settings > Privacy > Site Settings > Pop-ups
• Firefox: Settings > Privacy & Security > Permissions > Block pop-up windows
• Safari: Preferences > Websites > Pop-up Windows
    `.trim();

    alert(message);
  }

  /**
   * Check popup support and warn user if needed
   */
  static checkPopupSupport(): boolean {
    const isBlocked = this.testPopupBlocked();
    if (isBlocked) {
      console.warn('Popup blocker detected. Authentication may fail.');
      // Don't prevent authentication attempt, just warn
      return true; // Changed from false to true to allow authentication
    }
    return true;
  }
}

export default PopupService;
