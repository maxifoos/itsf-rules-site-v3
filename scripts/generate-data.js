// Regenerates src/data/glossary.json and src/data/outcomes.json from the
// "Definitions" and "Awards and Sanctions" pages. Runs automatically before
// `start`/`build` (see package.json), so those pages stay the single source
// of truth for term/outcome auto-highlighting.
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'standard-matchplay-rules');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Terms excluded even though they appear as a "**Term**: definition" entry on
// the Awards and Sanctions page: too generic/verb-like to safely auto-link
// every occurrence (e.g. "play will continue" or "players return to the
// table" are not references to the Continue or Return outcomes).
const EXCLUDED_OUTCOME_TERMS = new Set(['continue', 'return']);

function writeJson(fileName, entries) {
  const outputFile = path.join(DATA_DIR, fileName);
  fs.mkdirSync(DATA_DIR, {recursive: true});
  fs.writeFileSync(outputFile, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`Generated ${entries.length} entries -> ${path.relative(process.cwd(), outputFile)}`);
}

function readNormalized(fileName) {
  // Tolerate CRLF line endings so this doesn't silently break on a checkout
  // or an edit that reintroduces them.
  return fs.readFileSync(path.join(DOCS_DIR, fileName), 'utf-8').replace(/\r\n/g, '\n');
}

// Tooltips render the definition as plain text, so a Markdown link in it
// (e.g. a cross-reference to another chapter) must be flattened to its link
// text rather than shown as literal `[text](url)`.
function stripLinks(raw) {
  return raw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

// Both the Definitions page and the Awards and Sanctions page list their
// entries as a flat "**Term**: definition" line per entry, so the same
// extraction works for both.
function extractBoldTerms(content) {
  const termLine = /\*\*([^*]+)\*\*:\s*(.+)/g;
  const entries = [];
  let match;
  while ((match = termLine.exec(content)) !== null) {
    entries.push({term: match[1].trim(), definition: stripLinks(match[2].trim())});
  }
  return entries;
}

function generateGlossary() {
  const content = readNormalized('20-definitions.md');
  writeJson('glossary.json', extractBoldTerms(content));
}

function generateOutcomes() {
  const content = readNormalized('17-awards-and-sanctions.md');
  const entries = extractBoldTerms(content).filter(
    (entry) => !EXCLUDED_OUTCOME_TERMS.has(entry.term.toLowerCase()),
  );
  writeJson('outcomes.json', entries);
}

generateGlossary();
generateOutcomes();
