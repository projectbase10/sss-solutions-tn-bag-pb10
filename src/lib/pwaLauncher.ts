/**
 * PWA Launcher utility for launching installed PWAs or falling back to browser
 */

export interface PWALaunchResult {
  success: boolean;
  method: 'pwa' | 'browser' | 'failed';
  message?: string;
}

/**
 * Attempts to launch the Other Branch PWA at https://sss.marzelet.com/
 * Falls back to opening in browser if PWA is not available
 * Simplified approach that lets the browser/OS handle PWA launching
 */
export async function launchUPBranchPWA(): Promise<PWALaunchResult> {
  const targetUrl = 'https://sss.marzelet.com/';
  
  // Check if current app is running as PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone ||
               document.referrer.includes('android-app://');
  
  try {
    // If we're in a PWA, navigate in same tab to maintain PWA experience
    if (isPWA) {
      window.location.href = targetUrl;
      return {
        success: true,
        method: 'pwa',
        message: 'Navigated in same tab (PWA mode)'
      };
    }

    // For regular browser, open in new tab
    // The browser will automatically launch the PWA if it's installed and configured
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    
    return {
      success: true,
      method: 'browser',
      message: 'Opened in new tab - browser will launch PWA if installed'
    };
    
  } catch (error) {
    console.error('Failed to launch UP Branch:', error);
    
    // Fallback: try basic window.open
    try {
      window.open(targetUrl, '_blank');
      return {
        success: true,
        method: 'browser',
        message: 'Opened in browser (fallback)'
      };
    } catch (fallbackError) {
      return {
        success: false,
        method: 'failed',
        message: 'Failed to open application'
      };
    }
  }
}