// Small inline icons, 24×24, stroked with currentColor unless noted.

const s = (body: string, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICON = {
  /** Padlock; the shackle is its own path so it can open. Body is filled. */
  lock: `<svg class="ic pad" viewBox="0 0 24 24" aria-hidden="true">
      <path class="shackle" d="M8 11V7.6a4 4 0 0 1 8 0V11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <rect class="pad-body" x="4.2" y="10.4" width="15.6" height="11.2" rx="2.6" fill="currentColor"/>
      <circle class="pad-hole" cx="12" cy="15.4" r="1.7"/>
      <rect class="pad-hole" x="11.1" y="15.6" width="1.8" height="3.2" rx=".9"/>
    </svg>`,
  db: s('<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>'),
  key: s('<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3M16 7l3 3M14 9l2 2"/>'),
  check: s('<path d="M4.5 12.5l5 5L19.5 7"/>'),
  cross: s('<path d="M6 6l12 12M18 6 6 18"/>'),
  hourglass: s('<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>'),
  clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  mail: s('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>'),
  camera: s('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.6"/>'),
  bolt: s('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  pause: s('<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>'),
  heart: s('<path d="M3 12h4l2-5 3 10 2.5-7 1.5 2H21"/>'),
  broom: s('<path d="M19 3 11 11M7.5 11.5l5 5M4 21c1-4 2.5-7 5.5-9l2.5 2.5c-2 3-5 4.5-8 6.5z"/>'),
  radar: s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.5 5.5"/>'),
  skull: s('<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="11.5" r="1.6"/><circle cx="15" cy="11.5" r="1.6"/><path d="M10 20v-2M14 20v-2"/>'),
  refresh: s('<path d="M20 11a8 8 0 0 0-14.3-4.6L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.6L20 16M20 20v-4h-4"/>'),
  trash: s('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  phone: s('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
  shield: s('<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  arrowL: s('<path d="M20 12H5M11 6l-6 6 6 6"/>'),
  plane: s('<path d="M21 15.5 13.5 11V5a1.5 1.5 0 0 0-3 0v6L3 15.5V17l7.5-2.2V19l-2 1.5V22l3.5-1 3.5 1v-1.5l-2-1.5v-4.2L21 17z"/>'),
};
