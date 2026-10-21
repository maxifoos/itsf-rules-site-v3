import React, {type ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import glossaryEn from '@site/src/data/glossary.en.json';
import glossaryFr from '@site/src/data/glossary.fr.json';
import glossaryDe from '@site/src/data/glossary.de.json';
import {buildGlossaryIndex, splitByGlossaryMatches, type GlossaryEntry} from '@site/src/utils/glossaryMatch';
import HoverTooltip from '@site/src/components/HoverTooltip';
import styles from './styles.module.css';

// Mirrors scripts/generate-data.js and src/remark/glossaryTerms.ts: one
// glossary per translated locale, since the tooltip body re-matches nested
// terms against whichever language it's currently rendering.
const GLOSSARY_BY_LOCALE: Record<string, GlossaryEntry[]> = {en: glossaryEn, fr: glossaryFr, de: glossaryDe};
const glossaryIndexByLocale = Object.fromEntries(
  Object.entries(GLOSSARY_BY_LOCALE).map(([locale, entries]) => [locale, buildGlossaryIndex(entries)]),
);

function capitalize(term: string): string {
  return term.charAt(0).toUpperCase() + term.slice(1);
}

export default function GlossaryTerm({
  term,
  children,
  ancestorTerms,
}: {
  term: string;
  children: ReactNode;
  // Terms already shown higher up this chain of nested tooltips (this term
  // included once resolved below). Passed down when a definition's own
  // tooltip nests further GlossaryTerms, so a cycle of cross-referencing
  // definitions renders as plain text instead of recursing forever.
  ancestorTerms?: ReadonlySet<string>;
}): ReactNode {
  const {i18n} = useDocusaurusContext();
  const glossaryIndex = glossaryIndexByLocale[i18n.currentLocale] ?? glossaryIndexByLocale.en;
  const entry = glossaryIndex.lookup.get(term.toLowerCase());
  if (!entry) {
    return <>{children}</>;
  }

  const ownAncestors = new Set(ancestorTerms);
  ownAncestors.add(entry.term.toLowerCase());

  const bodySegments = splitByGlossaryMatches(entry.definition, glossaryIndex, ownAncestors);

  return (
    <HoverTooltip
      triggerClassName={styles.defTerm}
      tooltipClassName={styles.tooltip}
      tooltip={
        <>
          <span className={styles.tooltipTitle}>{capitalize(entry.term)}</span>
          <span className={styles.tooltipBody}>
            {bodySegments.map((segment, i) =>
              segment.match ? (
                <GlossaryTerm key={i} term={segment.match.term} ancestorTerms={ownAncestors}>
                  {segment.text}
                </GlossaryTerm>
              ) : (
                <React.Fragment key={i}>{segment.text}</React.Fragment>
              ),
            )}
          </span>
        </>
      }
    >
      {children}
    </HoverTooltip>
  );
}
