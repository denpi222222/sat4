export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
}

export function isDesktop() {
  if (typeof navigator === 'undefined') return true;
  return !isMobile();
}

export function isTelegramWebView() {
  if (typeof navigator === 'undefined') return false;
  return /Telegram/i.test(navigator.userAgent);
}

export function isYandexMobile() {
  if (typeof navigator === 'undefined') return false;
  return /YaBrowser|Yandex/i.test(navigator.userAgent) && /Mobile/i.test(navigator.userAgent);
}

export function isMobileWebView() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isWebKit = /AppleWebKit/i.test(ua);
  const isMobile = /Mobile|iPhone|iPad|Android/i.test(ua);
  const isStandalone = (window as any).navigator?.standalone === true;
  return (isMobile && isWebKit) || isTelegramWebView() || isYandexMobile() || isStandalone;
}
