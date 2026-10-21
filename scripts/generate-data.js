// Regenerates src/data/glossary.<locale>.json and src/data/outcomes.<locale>.json
// from each locale's "Definitions" and "Awards and Sanctions" pages. Runs
// automatically before `start`/`build` (see package.json), so those pages
// stay the single source of truth for term/outcome auto-highlighting, in
// every language the site is translated into.
const fs = require('fs');
const path = require('path');

const SITE_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(SITE_ROOT, 'src', 'data');
const DEFAULT_LOCALE = 'en';
// Locales with translated content. Add to this list (and to docusaurus.config.ts
// / i18n.locales) as more languages are translated.
const LOCALES = ['en', 'fr', 'de'];

// Terms excluded even though they appear as a "**Term**: definition" entry on
// the Awards and Sanctions page: too generic/verb-like to safely auto-link
// every occurrence (e.g. "play will continue" or "players return to the
// table" are not references to the Continue or Return outcomes). Keyed by
// locale since the excluded word is itself translated.
const EXCLUDED_OUTCOME_TERMS = {
  en: new Set(['continue', 'return']),
  fr: new Set(['continuer', 'retour']),
  de: new Set(['weiterspielen', 'rückgabe']),
};

function docsDirFor(locale) {
  return locale === DEFAULT_LOCALE
    ? path.join(SITE_ROOT, 'docs', 'standard-matchplay-rules')
    : path.join(SITE_ROOT, 'i18n', locale, 'docusaurus-plugin-content-docs', 'current', 'standard-matchplay-rules');
}

function writeJson(fileName, entries) {
  const outputFile = path.join(DATA_DIR, fileName);
  fs.mkdirSync(DATA_DIR, {recursive: true});
  fs.writeFileSync(outputFile, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`Generated ${entries.length} entries -> ${path.relative(process.cwd(), outputFile)}`);
}

function readNormalized(docsDir, fileName) {
  // Tolerate CRLF line endings so this doesn't silently break on a checkout
  // or an edit that reintroduces them.
  return fs.readFileSync(path.join(docsDir, fileName), 'utf-8').replace(/\r\n/g, '\n');
}

// Tooltips render the definition as plain text, so a Markdown link in it
// (e.g. a cross-reference to another chapter) must be flattened to its link
// text rather than shown as literal `[text](url)`.
function stripLinks(raw) {
  return raw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

// Both the Definitions page and the Awards and Sanctions page list their
// entries as a flat "**Term**: definition" line per entry, so the same
// extraction works for both, in every locale.
function extractBoldTerms(content) {
  const termLine = /\*\*([^*]+)\*\*:\s*(.+)/g;
  const entries = [];
  let match;
  while ((match = termLine.exec(content)) !== null) {
    entries.push({term: match[1].trim(), definition: stripLinks(match[2].trim())});
  }
  return entries;
}

function generateGlossary(locale, docsDir) {
  const content = readNormalized(docsDir, '20-definitions.md');
  writeJson(`glossary.${locale}.json`, extractBoldTerms(content));
}

function generateOutcomes(locale, docsDir) {
  const content = readNormalized(docsDir, '17-awards-and-sanctions.md');
  const excluded = EXCLUDED_OUTCOME_TERMS[locale] ?? new Set();
  const entries = extractBoldTerms(content).filter((entry) => !excluded.has(entry.term.toLowerCase()));
  writeJson(`outcomes.${locale}.json`, entries);
}

for (const locale of LOCALES) {
  const docsDir = docsDirFor(locale);
  generateGlossary(locale, docsDir);
  generateOutcomes(locale, docsDir);
}
