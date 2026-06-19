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

const store = new NoteStore();
const state = {
  activeId: store.notes[0]?.id ?? null,
  tag: null,
  mode: localStorage.getItem('inkpad.mode') || 'split',
};

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function renderList() {
  const notes = store.search({ query: els.search.value, tag: state.tag });
  els.list.innerHTML = '';
  if (!notes.length) {
    els.list.innerHTML = '<li class="empty">No notes found</li>';
    return;
  }
  for (const note of notes) {
    const li = document.createElement('li');
    li.className = 'note-item' + (note.id === state.activeId ? ' active' : '');
    li.dataset.id = note.id;
    const preview = note.body.replace(/^#.*$/m, '').replace(/[#*_`>[\]-]/g, '').trim().slice(0, 80);
    li.innerHTML = `
      <div class="note-title">${note.pinned ? '<span class="pin">📌</span>' : ''}${escape(note.title)}</div>
      <div class="note-snippet">${escape(preview) || '<em>Empty note</em>'}</div>
      <div class="note-date">${relativeTime(note.updated)}</div>`;
    els.list.appendChild(li);
  }
}

function renderTags() {
  const tags = store.allTags();
  els.tags.innerHTML = '';
  const all = document.createElement('button');
  all.textContent = 'All notes';
  all.className = 'chip' + (state.tag === null ? ' active' : '');
  all.onclick = () => selectTag(null);
  els.tags.appendChild(all);
  for (const [tag, count] of tags) {
    const chip = document.createElement('button');
    chip.className = 'chip' + (state.tag === tag ? ' active' : '');
    chip.innerHTML = `#${escape(tag)} <span>${count}</span>`;
    chip.onclick = () => selectTag(tag);
    els.tags.appendChild(chip);
  }
