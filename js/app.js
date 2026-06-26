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
}

function renderEditor() {
  const note = store.get(state.activeId);
  const hasNote = Boolean(note);
  els.editor.disabled = !hasNote;
  els.pinBtn.disabled = !hasNote;
  els.deleteBtn.disabled = !hasNote;
  if (!hasNote) {
    els.editor.value = '';
    els.preview.innerHTML = '<p class="placeholder">Select or create a note.</p>';
    els.meta.textContent = '';
    return;
  }
  if (els.editor.value !== note.body) els.editor.value = note.body;
  els.pinBtn.textContent = note.pinned ? 'Unpin' : 'Pin';
  renderPreview();
}

function renderPreview() {
  const text = els.editor.value;
  els.preview.innerHTML = renderMarkdown(text);
  const note = store.get(state.activeId);
  const words = wordCount(text);
  els.meta.textContent = `${words} words · ${Math.max(1, Math.round(words / 200))} min read` +
    (note ? ` · edited ${relativeTime(note.updated)}` : '');
}

function applyMode() {
  els.workspace.dataset.mode = state.mode;
  els.modeBtn.textContent = { split: 'Split', edit: 'Edit', preview: 'Preview' }[state.mode];
  localStorage.setItem('inkpad.mode', state.mode);
}

function cycleMode() {
  const order = ['split', 'edit', 'preview'];
  state.mode = order[(order.indexOf(state.mode) + 1) % order.length];
  applyMode();
}

function selectNote(id) {
  state.activeId = id;
  renderList();
  renderEditor();
}

function selectTag(tag) {
  state.tag = tag;
  renderTags();
  renderList();
}

function newNote() {
  const note = store.create(state.tag ? `# New note\n\n#${state.tag}\n` : undefined);
  selectNote(note.id);
  els.editor.focus();
  els.editor.setSelectionRange(2, 10);
}

function deleteNote() {
  const note = store.get(state.activeId);
  if (!note || !confirm('Delete this note?')) return;
  store.remove(note.id);
  state.activeId = store.search()[0]?.id ?? null;
  renderTags();
  renderList();
  renderEditor();
}

function escape(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const save = debounce(() => {
  store.update(state.activeId, els.editor.value);
  renderList();
  renderTags();
}, 300);

function handleTab(event) {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  const { selectionStart: start, selectionEnd: end, value } = els.editor;
  els.editor.value = value.slice(0, start) + '  ' + value.slice(end);
  els.editor.selectionStart = els.editor.selectionEnd = start + 2;
  renderPreview();
  save();
}

function exportNotes() {
  const blob = new Blob([store.exportJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `inkpad-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importNotes(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const count = store.importJson(await file.text());
    alert(`Imported ${count} notes`);
    renderTags();
    renderList();
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }
  event.target.value = '';
