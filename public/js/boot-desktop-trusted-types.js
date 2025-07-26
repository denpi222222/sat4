(function(){
  try {
    var ua = navigator.userAgent;
    var isMobile = /(Mobile|iPhone|iPad|Android)/i.test(ua) || /Telegram/i.test(ua);
    if (!isMobile && window.trustedTypes && window.trustedTypes.createPolicy) {
      var s = document.createElement('script');
      s.src = '/trusted-types.js';
      s.defer = true;
      document.head.appendChild(s);
    }
  } catch (e) {}
})();
