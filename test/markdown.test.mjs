import test from 'node:test';
import assert from 'node:assert';
import { renderMarkdown, renderInline, extractTags, extractTitle } from '../js/markdown.js';
import { NoteStore, relativeTime, wordCount } from '../js/notes.js';

test('renders headings with ids', () => {
  assert.strictEqual(renderMarkdown('## Hello World'), '<h2 id="hello-world">Hello World</h2>');
});

test('renders inline formatting', () => {
  assert.strictEqual(
    renderInline('**bold** *it* `code` ~~gone~~'),
    '<strong>bold</strong> <em>it</em> <code>code</code> <del>gone</del>',
  );
});

test('escapes html and blocks javascript urls', () => {
  assert.strictEqual(renderInline('<script>'), '&lt;script&gt;');
  assert.match(renderInline('[x](javascript:alert(1))'), /href="#"/);
});

test('renders lists and tasks', () => {
