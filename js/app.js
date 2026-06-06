import { renderMarkdown } from './markdown.js';
import { NoteStore, relativeTime, wordCount } from './notes.js';

const $ = (sel) => document.querySelector(sel);

const els = {
  list: $('#note-list'),
  tags: $('#tag-list'),
  search: $('#search'),
  editor: $('#editor'),
  preview: $('#preview'),
  workspace: $('#workspace'),
  meta: $('#meta'),
  newBtn: $('#new-note'),
  pinBtn: $('#pin-note'),
  deleteBtn: $('#delete-note'),
  modeBtn: $('#toggle-mode'),
  themeBtn: $('#toggle-theme'),
  exportBtn: $('#export'),
  importInput: $('#import'),
};
