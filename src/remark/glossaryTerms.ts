import {visit} from 'unist-util-visit';
import type {Plugin} from 'unified';
import type {Node, Parent} from 'unist';
import glossaryEntries from '../data/glossary.json';
import outcomeEntries from '../data/outcomes.json';
import {buildGlossaryIndex, splitByGlossaryMatches, type GlossaryIndex} from '../utils/glossaryMatch';

// Node types whose text content should never be auto-linked: code, headings,
// and bold labels (term names on the Definitions page, "Award:"/"Sanction:"
// labels elsewhere). Also skips inside nodes we've already wrapped ourselves.
const SKIP_PARENT_TYPES = new Set(['inlineCode', 'code', 'heading', 'strong']);
const OWN_COMPONENT_NAMES = new Set(['GlossaryTerm', 'OutcomeTerm']);

const glossaryIndex = buildGlossaryIndex(glossaryEntries);
const outcomeIndex = buildGlossaryIndex(outcomeEntries);

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
  return (tree) => {
    // Award/Sanction names first: they're compound phrases (e.g. "5-Rod
    // Possession Award") that can contain a shorter glossary word (e.g.
    // "Possession"), so they must claim their text before the glossary pass
    // fragments it.
    highlight(tree, outcomeIndex, 'OutcomeTerm');
    highlight(tree, glossaryIndex, 'GlossaryTerm');
  };
};

export default glossaryTermsPlugin;
