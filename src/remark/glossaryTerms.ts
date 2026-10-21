import {visit} from 'unist-util-visit';
import type {Plugin} from 'unified';
import type {Node, Parent} from 'unist';
import glossaryEn from '../data/glossary.en.json';
import glossaryFr from '../data/glossary.fr.json';
import glossaryDe from '../data/glossary.de.json';
import outcomesEn from '../data/outcomes.en.json';
import outcomesFr from '../data/outcomes.fr.json';
import outcomesDe from '../data/outcomes.de.json';
import {buildGlossaryIndex, splitByGlossaryMatches, type GlossaryEntry, type GlossaryIndex} from '../utils/glossaryMatch';

// Node types whose text content should never be auto-linked: code, headings,
// and bold labels (term names on the Definitions page, "Award:"/"Sanction:"
// labels elsewhere). Also skips inside nodes we've already wrapped ourselves.
const SKIP_PARENT_TYPES = new Set(['inlineCode', 'code', 'heading', 'strong']);
const OWN_COMPONENT_NAMES = new Set(['GlossaryTerm', 'OutcomeTerm']);

// Each locale's docs are matched against that locale's own glossary/outcome
// terms (translated text won't contain the English words), so each needs its
// own index. Add an entry here (and in scripts/generate-data.js and
// docusaurus.config.ts's i18n.locales) when a new language is translated.
const GLOSSARY_BY_LOCALE: Record<string, GlossaryEntry[]> = {en: glossaryEn, fr: glossaryFr, de: glossaryDe};
const OUTCOMES_BY_LOCALE: Record<string, GlossaryEntry[]> = {en: outcomesEn, fr: outcomesFr, de: outcomesDe};
const DEFAULT_LOCALE = 'en';

const glossaryIndexByLocale: Record<string, GlossaryIndex> = Object.fromEntries(
  Object.entries(GLOSSARY_BY_LOCALE).map(([locale, entries]) => [locale, buildGlossaryIndex(entries)]),
);
const outcomeIndexByLocale: Record<string, GlossaryIndex> = Object.fromEntries(
  Object.entries(OUTCOMES_BY_LOCALE).map(([locale, entries]) => [locale, buildGlossaryIndex(entries)]),
);

// Translated docs live under i18n/<locale>/docusaurus-plugin-content-docs/current/...;
// anything else (the default docs/ tree) is English.
function detectLocale(filePath: string | undefined): string {
  if (!filePath) return DEFAULT_LOCALE;
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/\/i18n\/([^/]+)\//);
  const locale = match?.[1];
  return locale && GLOSSARY_BY_LOCALE[locale] ? locale : DEFAULT_LOCALE;
}

function isSkippedParent(parent: Parent): boolean {
  if (SKIP_PARENT_TYPES.has(parent.type)) return true;
  const name = (parent as {name?: string}).name;
  return typeof name === 'string' && OWN_COMPONENT_NAMES.has(name);
}

function highlight(tree: Node, index: GlossaryIndex, componentName: string) {
  visit(tree, 'text', (node: {value: string}, nodeIndex, parent: Parent | undefined) => {
    if (!parent || nodeIndex === null || nodeIndex === undefined) return;
    if (isSkippedParent(parent)) return;

    const segments = splitByGlossaryMatches(node.value, index);
    if (segments.length === 1 && !segments[0].match) return;

    const newNodes = segments.map((segment) =>
      segment.match
        ? {
            type: 'mdxJsxTextElement',
            name: componentName,
            attributes: [
              {type: 'mdxJsxAttribute', name: 'term', value: segment.match.term},
            ],
            children: [{type: 'text', value: segment.text}],
          }
        : {type: 'text', value: segment.text},
    );

    (parent.children as unknown[]).splice(nodeIndex, 1, ...newNodes);
    return nodeIndex + newNodes.length;
  });
}

const glossaryTermsPlugin: Plugin = function glossaryTermsPlugin() {
  return (tree, file) => {
    const locale = detectLocale((file as {path?: string}).path);
    const glossaryIndex = glossaryIndexByLocale[locale];
    const outcomeIndex = outcomeIndexByLocale[locale];
    // Award/Sanction names first: they're compound phrases (e.g. "5-Rod
    // Possession Award") that can contain a shorter glossary word (e.g.
    // "Possession"), so they must claim their text before the glossary pass
    // fragments it.
    highlight(tree, outcomeIndex, 'OutcomeTerm');
    highlight(tree, glossaryIndex, 'GlossaryTerm');
  };
};

export default glossaryTermsPlugin;
