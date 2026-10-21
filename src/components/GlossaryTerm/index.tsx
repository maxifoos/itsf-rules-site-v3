import React, {type ReactNode} from 'react';
import glossaryEntries from '@site/src/data/glossary.json';
import {buildGlossaryIndex, splitByGlossaryMatches} from '@site/src/utils/glossaryMatch';
import HoverTooltip from '@site/src/components/HoverTooltip';
import styles from './styles.module.css';

const glossaryIndex = buildGlossaryIndex(glossaryEntries);

function capitalize(term: string): string {
  return term.charAt(0).toUpperCase() + term.slice(1);
}

export default function GlossaryTerm({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}): ReactNode {
  const entry = glossaryIndex.lookup.get(term.toLowerCase());
  if (!entry) {
    return <>{children}</>;
  }

  const bodySegments = splitByGlossaryMatches(entry.definition, glossaryIndex, entry.term.toLowerCase());

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
                <strong key={i} className={styles.tooltipTerm}>
                  {segment.text}
                </strong>
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
