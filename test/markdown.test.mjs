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
  const html = renderMarkdown('- one\n- [x] done\n- [ ] todo');
  assert.match(html, /<ul><li>one<\/li>/);
  assert.match(html, /checked> done/);
});

test('renders code fences without formatting inside', () => {
  assert.strictEqual(renderMarkdown('```js\nconst a = **b**;\n```'), '<pre><code class="lang-js">const a = **b**;</code></pre>');
});

test('renders tables', () => {
  const html = renderMarkdown('| a | b |\n| --- | ---: |\n| 1 | 2 |');
  assert.match(html, /<th>a<\/th>/);
  assert.match(html, /<td style="text-align:right">2<\/td>/);
});

test('extracts tags and titles', () => {
  assert.deepStrictEqual(extractTags('# Title\nSome #Ideas and #todo-list #ideas'), ['ideas', 'todo-list']);
  assert.strictEqual(extractTitle('intro\n# Real title'), 'Real title');
  assert.strictEqual(extractTitle(''), 'Untitled');
});

function memoryStorage() {
  const data = {};
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v) };
}

test('note store creates a welcome note and supports search', () => {
  const store = new NoteStore(memoryStorage());
  assert.strictEqual(store.notes.length, 1);
  store.create('# Groceries\n#shopping milk');
  assert.strictEqual(store.search({ query: 'milk' }).length, 1);
  assert.strictEqual(store.search({ tag: 'shopping' })[0].title, 'Groceries');
});

test('pinned notes are listed first', () => {
