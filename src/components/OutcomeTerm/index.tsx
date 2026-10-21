import React, {type ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import outcomesEn from '@site/src/data/outcomes.en.json';
import outcomesFr from '@site/src/data/outcomes.fr.json';
import outcomesDe from '@site/src/data/outcomes.de.json';
import glossaryEn from '@site/src/data/glossary.en.json';
import glossaryFr from '@site/src/data/glossary.fr.json';
import glossaryDe from '@site/src/data/glossary.de.json';
import {buildGlossaryIndex, splitByGlossaryMatches, type GlossaryEntry} from '@site/src/utils/glossaryMatch';
import GlossaryTerm from '@site/src/components/GlossaryTerm';
import HoverTooltip from '@site/src/components/HoverTooltip';
import styles from './styles.module.css';

// Mirrors scripts/generate-data.js: one Awards/Sanctions index per
// translated locale.
const OUTCOMES_BY_LOCALE: Record<string, GlossaryEntry[]> = {en: outcomesEn, fr: outcomesFr, de: outcomesDe};
const outcomeIndexByLocale = Object.fromEntries(
  Object.entries(OUTCOMES_BY_LOCALE).map(([locale, entries]) => [locale, buildGlossaryIndex(entries)]),
);

// Award/Sanction descriptions reference regular glossary concepts (possession,
// team, restart, ...); nested matches there link to the real GlossaryTerm,
// same as running prose.
const GLOSSARY_BY_LOCALE: Record<string, GlossaryEntry[]> = {en: glossaryEn, fr: glossaryFr, de: glossaryDe};
const glossaryIndexByLocale = Object.fromEntries(
  Object.entries(GLOSSARY_BY_LOCALE).map(([locale, entries]) => [locale, buildGlossaryIndex(entries)]),
);

export default function OutcomeTerm({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}): ReactNode {
  const {i18n} = useDocusaurusContext();
  const outcomeIndex = outcomeIndexByLocale[i18n.currentLocale] ?? outcomeIndexByLocale.en;
  const glossaryIndex = glossaryIndexByLocale[i18n.currentLocale] ?? glossaryIndexByLocale.en;
  const entry = outcomeIndex.lookup.get(term.toLowerCase());
  if (!entry) {
    return <>{children}</>;
  }

  const bodySegments = splitByGlossaryMatches(entry.definition, glossaryIndex);

  return (
    <HoverTooltip
      triggerClassName={styles.outcomeTerm}
      tooltipClassName={styles.tooltip}
      tooltip={
        <>
          <span className={styles.tooltipTitle}>{entry.term}</span>
          <span className={styles.tooltipBody}>
            {bodySegments.map((segment, i) =>
              segment.match ? (
                <GlossaryTerm key={i} term={segment.match.term}>
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
