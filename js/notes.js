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
