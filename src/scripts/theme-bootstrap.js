// @ts-check

// Included as raw JavaScript in <head>: it must execute synchronously before
// the first paint. Keep it standalone; imports would defer its execution.
(() => {
  /** @type {'light' | 'dark' | null} */
  let preference = null;

  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    // Storage may be unavailable; the system preference still works.
  }

  const theme =
    preference ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset['theme'] = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#202721' : '#faf8f3');
})();
