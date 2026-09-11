type Theme = 'light' | 'dark';

function parseTheme(value: string | null): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

function readPreference(): Theme | null {
  try {
    return parseTheme(localStorage.getItem('theme'));
  } catch {
    return null;
  }
}

/** Enhance the reserved dial space without changing the surrounding layout. */
export function initializeThemeDial(): void {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-theme-toggle]',
  );
  if (!button) return;

  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const browserTheme = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  let preference = readPreference();

  const apply = (theme: Theme): void => {
    root.dataset['theme'] = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.title =
      button.dataset[theme === 'dark' ? 'switchLight' : 'switchDark'] ??
      button.title;
    if (browserTheme)
      browserTheme.content = theme === 'dark' ? '#202721' : '#faf8f3';
  };

  const resolve = (): Theme =>
    preference ?? (system.matches ? 'dark' : 'light');

  apply(resolve());
  button.hidden = false;
  // Animate only changes made after the initial dial state has painted.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.add('theme-ready')),
  );

  button.addEventListener('click', () => {
    preference = root.dataset['theme'] === 'dark' ? 'light' : 'dark';
    apply(preference);
    try {
      localStorage.setItem('theme', preference);
    } catch {
      // The current page keeps working when persistence is unavailable.
    }
  });

  system.addEventListener('change', () => {
    if (!preference) apply(resolve());
  });

  window.addEventListener('storage', (event) => {
    // Ignore same-named keys in sessionStorage; only localStorage is persisted.
    if (event.key !== 'theme' && event.key !== null) return;
    try {
      if (event.storageArea !== localStorage) return;
    } catch {
      return;
    }
    preference = parseTheme(event.newValue);
    apply(resolve());
  });
}
