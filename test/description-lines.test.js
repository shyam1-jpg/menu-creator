const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const c = vm.createContext({});
vm.runInContext(html.slice(html.indexOf('function toSentenceCase('), html.indexOf('function sentenceCase(')), c);
vm.runInContext(html.slice(html.indexOf('function descriptionLines('), html.indexOf('function fitDescriptions(')), c);
for (const desc of ['A smooth, creamy cheesecake with refreshing passion fruit flavour.', 'Vegetarian sausages with creamy mashed potatoes and rich mock onion-style gravy.', 'Tender vegetables.', 'A fragrant soup with fresh herbs and warming spices. '.repeat(8)]) {
  const lines = c.descriptionLines(desc);
  assert.equal(lines.length, 2);
  assert.equal(lines.join(' '), c.toSentenceCase(desc));
  assert.ok(lines.every(Boolean));
  assert.equal(c.descriptionLines(lines.join('\n')).join(' '), lines.join(' '));
}
assert.equal(c.descriptionLines('').length, 0);
assert.equal(c.descriptionLines('Delicious').length, 1);
assert.ok(html.includes('descriptionLines(d.desc).map(esc).join("<br>")'));
console.log('two-line description regression tests passed');
