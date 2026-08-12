import { extractTags, extractTitle } from './markdown.js';

const STORAGE_KEY = 'inkpad.notes.v1';

const WELCOME = `# Welcome to Inkpad ✍️

Inkpad is a tiny **Markdown** notebook that lives in your browser.

## Things to try
- [x] Write some *Markdown*
- [ ] Add a tag like #ideas or #todo
- [ ] Press \`Ctrl + K\` to search
- [ ] Toggle the theme with the ☾ button

> Notes are saved automatically in localStorage.

| Shortcut | Action |
| --- | --- |
| Ctrl + N | New note |
| Ctrl + K | Search |
| Ctrl + P | Toggle preview |
`;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class NoteStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.listeners = new Set();
    this.notes = this.load();
    if (this.notes.length === 0) this.create(WELCOME);
  }

  load() {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  persist() {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.notes));
    } catch {
      // storage might be full or unavailable — keep working in memory
    }
    this.listeners.forEach((fn) => fn(this.notes));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  create(body = '# New note\n\n') {
    const now = Date.now();
    const note = { id: uid(), body, pinned: false, created: now, updated: now };
    this.notes.unshift(note);
    this.persist();
    return note;
  }

  get(id) {
