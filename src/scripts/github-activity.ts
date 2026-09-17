const calendar = document.querySelector<HTMLElement>('[data-github-activity]');
if (calendar) {
  const days = Array.from(
    calendar.querySelectorAll<HTMLButtonElement>('[data-date]'),
  ).sort((a, b) =>
    (a.dataset['date'] ?? '').localeCompare(b.dataset['date'] ?? ''),
  );
  const detail = calendar.querySelector<HTMLElement>('[data-calendar-detail]');
  const scroll = calendar.querySelector<HTMLElement>('[data-calendar-scroll]');
  // On small screens start at the recent end of the year; the whole year scrolls.
  if (scroll) scroll.scrollLeft = scroll.scrollWidth;

  const showDay = (day: HTMLButtonElement) => {
    if (detail) detail.textContent = day.getAttribute('aria-label');
  };

  for (const [index, day] of days.entries()) {
    day.addEventListener('pointerenter', () => showDay(day));
    day.addEventListener('click', () => showDay(day));
    day.addEventListener('focus', () => {
      for (const other of days) other.tabIndex = other === day ? 0 : -1;
      showDay(day);
    });
    day.addEventListener('keydown', (event) => {
      const weekday = new Date(`${day.dataset['date']}T00:00:00Z`).getUTCDay();
      let next: number;
      switch (event.key) {
        case 'ArrowLeft':
          next = index - 7;
          break;
        case 'ArrowRight':
          next = index + 7;
          break;
        case 'ArrowUp':
          next = index - 1;
          break;
        case 'ArrowDown':
          next = index + 1;
          break;
        case 'Home':
          next = event.ctrlKey || event.metaKey ? 0 : index - weekday;
          break;
        case 'End':
          next =
            event.ctrlKey || event.metaKey
              ? days.length - 1
              : index + 6 - weekday;
          break;
        default:
          return;
      }
      event.preventDefault();
      days[Math.max(0, Math.min(days.length - 1, next))]?.focus();
    });
  }
}
