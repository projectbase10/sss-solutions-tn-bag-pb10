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
 * Uses conditional navigation: same-tab if current app is PWA, new tab otherwise
 */
export async function launchUPBranchPWA(): Promise<PWALaunchResult> {
  const targetUrl = 'https://sss.marzelet.com/';
  
  // Check if current app is running as PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone ||
               document.referrer.includes('android-app://');
  
  // If we're already in a PWA, navigate in same tab
  if (isPWA) {
    try {
      window.location.href = targetUrl;
      return {
        success: true,
        method: 'pwa',
        message: 'Navigated in same tab (PWA)'
      };
    } catch (error) {
      console.error('Failed to navigate in same tab:', error);
    }
  }
  
  try {
    // First attempt: Try to detect if the PWA is installed
    if ('getInstalledRelatedApps' in navigator) {
      try {
        const relatedApps = await (navigator as any).getInstalledRelatedApps();
        const targetApp = relatedApps.find((app: any) => 
          app.url && app.url.includes('sss.marzelet.com')
        );
        
        if (targetApp) {
          // PWA is installed, try to open it
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
          return {
            success: true,
            method: 'pwa',
            message: 'Launched installed PWA'
          };
        }
      } catch (error) {
        console.log('getInstalledRelatedApps failed:', error);
      }
    }

    // Second attempt: Try opening with window features that might trigger PWA
    const pwaWindow = window.open(
      targetUrl, 
      '_blank', 
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
    );
    
    if (pwaWindow) {
      return {
        success: true,
        method: 'browser',
        message: 'Opened in browser/PWA'
      };
    }

    // Fallback: Regular window.open
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return {
      success: true,
      method: 'browser',
      message: 'Opened in browser'
    };
    
  } catch (error) {
    console.error('Failed to launch UP Branch:', error);
    
    // Last resort: try basic window.open
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