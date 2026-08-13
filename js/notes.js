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
    return this.notes.find((n) => n.id === id) || null;
  }

  update(id, body) {
    const note = this.get(id);
    if (!note || note.body === body) return note;
    note.body = body;
    note.updated = Date.now();
    this.persist();
    return note;
  }

  togglePin(id) {
    const note = this.get(id);
    if (!note) return null;
    note.pinned = !note.pinned;
    this.persist();
    return note;
  }

  remove(id) {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.persist();
  }

  search({ query = '', tag = null } = {}) {
    const q = query.trim().toLowerCase();
    return this.notes
      .filter((n) => !q || n.body.toLowerCase().includes(q))
      .filter((n) => !tag || extractTags(n.body).includes(tag))
      .map((n) => ({ ...n, title: extractTitle(n.body), tags: extractTags(n.body) }))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated);
  }
