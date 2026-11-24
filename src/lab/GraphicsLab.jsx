// src/lab/GraphicsLab.jsx
//
// Dev-only review board. Open it with:
//   http://localhost:3000/The-Labyrinth-of-Catlantis/?lab=wall-openings
// Add &shot=1 for the deterministic PNG layout used by scripts/visual-preview.mjs.
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { LabViewport } from './LabStage';
import { PROPOSALS, getProposal } from './proposals';
import './lab.css';

const MODES = [
  ['compare', 'Compare'],
  ['before', 'Current'],
  ['after', 'Proposed'],
];

const STATUS_LABELS = {
  'awaiting-review': 'AWAITING REVIEW',
  approved: 'APPROVED — READY TO IMPLEMENT',
  implemented: 'IMPLEMENTED — PLAYTESTING',
  verified: 'VERIFIED',
  rejected: 'REJECTED',
};

const dateStamp = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('.');
};

const labHref = (id) =>
  `${window.location.pathname}?lab=${encodeURIComponent(id)}`;

function ProposalIndex() {
  return (
    <div className="lab-root lab-root--index">
      <header className="lab-header">
        <div>
          <div className="lab-eyebrow">CATLANTIS <span>/</span> VISUAL LAB</div>
          <h1>Pick a proposal</h1>
          <p className="lab-subtitle">
            Side-development previews for visual changes. Nothing here is in the
            game until a proposal is explicitly approved.
          </p>
        </div>
        <div className="lab-meta">
          <div className="lab-status">DEV ONLY</div>
          <div className="lab-meta-line">CAPTURE <code>npm run preview -- &lt;slug&gt; --open</code></div>
        </div>
      </header>

      <main className="lab-index">
        {PROPOSALS.length === 0 && (
          <p className="lab-empty">
            No proposals yet. Copy <code>src/lab/proposals/_template.jsx</code> to
            get started.
          </p>
        )}

        {PROPOSALS.map((proposal) => (
          <a className="lab-index-card" href={labHref(proposal.id)} key={proposal.id}>
            <span className="lab-index-card-title">{proposal.title}</span>
            <span className="lab-index-card-sub">{proposal.subtitle}</span>
            <span className="lab-index-card-meta">
              <code>{proposal.id}</code>
              <span>{STATUS_LABELS[proposal.status] ?? proposal.status}</span>
            </span>
          </a>
        ))}
      </main>
    </div>
  );
}

function MissingProposal({ id }) {
  return (
    <div className="lab-root lab-root--index">
      <header className="lab-header">
        <div>
          <div className="lab-eyebrow">CATLANTIS <span>/</span> VISUAL LAB</div>
          <h1>Proposal not found</h1>
          <p className="lab-subtitle">
            <code>{id}</code> is not registered in{' '}
            <code>src/lab/proposals/index.js</code>.
          </p>
        </div>
        <div className="lab-meta">
          <a className="lab-back" href={labHref('')}>Back to proposals</a>
        </div>
      </header>
    </div>
  );
}

export function GraphicsLab({ params: passedParams }) {
  const params = passedParams ?? new URLSearchParams(window.location.search);
  const requestedId = params.get('lab') || '';
  const shot = params.get('shot') === '1';
  const initialView = params.get('view') || 'compare';

  const proposal = requestedId
    ? getProposal(requestedId)
    : PROPOSALS.length === 1
      ? PROPOSALS[0]
      : null;

  const [view, setView] = useState(
    MODES.some(([mode]) => mode === initialView) ? initialView : 'compare'
  );
  const [readyIds, setReadyIds] = useState(() => new Set());

  const activeVariants = useMemo(() => {
    if (!proposal || shot || view === 'compare') {
      return proposal?.variants ?? [];
    }

    if (view === 'before') {
      return proposal.variants.slice(0, 1);
    }

    if (view === 'after') {
      return proposal.variants.slice(-1);
    }

    return proposal.variants;
  }, [proposal, shot, view]);

  const variantKey = activeVariants.map((variant) => variant.id).join('|');
  const allReady = activeVariants.length > 0 && readyIds.size >= activeVariants.length;

  const handleReady = useCallback((id) => {
    setReadyIds((current) => {
      if (current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    setReadyIds(new Set());
    window.__LAB_READY__ = false;

    return () => {
      window.__LAB_READY__ = false;
    };
  }, [proposal?.id, variantKey]);

  useEffect(() => {
    if (!allReady) {
      return undefined;
    }

    // Give the shaders and the sky one extra moment to settle before the
    // screenshot script captures the page.
    const timer = setTimeout(() => {
      window.__LAB_READY__ = true;
    }, 450);

    return () => clearTimeout(timer);
  }, [allReady]);

  useEffect(() => {
    if (!proposal) {
      return undefined;
    }

    document.title = `${proposal.title} — Catlantis Visual Lab`;
    window.__LAB_INFO__ = {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      variants: activeVariants.map((variant) => variant.id),
      shot,
    };

    return () => {
      delete window.__LAB_INFO__;
      delete window.__LAB_READY__;
    };
  }, [proposal, activeVariants, shot]);

  if (requestedId && !proposal) {
    return <MissingProposal id={requestedId} />;
  }

  if (!proposal) {
    return <ProposalIndex />;
  }

  const statusLabel = STATUS_LABELS[proposal.status] ?? proposal.status;
  const pngPath = `doc/proposals/${proposal.id}/proposal.png`;
  const today = dateStamp();

  return (
    <div className={`lab-root${shot ? ' lab-root--shot' : ''}`}>
      <header className="lab-header">
        <div className="lab-header-main">
          <div className="lab-eyebrow">CATLANTIS <span>/</span> VISUAL LAB</div>
          <h1>{proposal.title}</h1>
          <p className="lab-subtitle">{proposal.subtitle}</p>
        </div>

        <div className="lab-meta">
          <div className={`lab-status${proposal.status === 'approved' ? ' is-approved' : ''}`}>
            {statusLabel}
          </div>
          <div className="lab-meta-line">PROPOSAL <code>{proposal.id}</code></div>
          <div className="lab-meta-line">DATE <code>{today}</code></div>
          <div className="lab-meta-line">CAPTURE <code>{pngPath}</code></div>
        </div>
      </header>

      {!shot && (
        <div className="lab-controls" role="group" aria-label="Preview mode">
          {MODES.map(([mode, label]) => (
            <button
              className={`lab-control${view === mode ? ' is-active' : ''}`}
              key={mode}
              onClick={() => setView(mode)}
              type="button"
            >
              {label}
            </button>
          ))}
          <span className="lab-control-hint">
            {activeVariants.length === 1
              ? 'Single view — use Compare to put both side by side.'
              : 'Same camera, same stage, one variable changed.'}
          </span>
        </div>
      )}

      <main
        className="lab-board"
        style={{ '--variant-count': activeVariants.length }}
      >
        {activeVariants.map((variant, index) => (
          <section className="lab-panel" key={variant.id}>
            <div className="lab-panel-head">
              <span className="lab-index">{String(index + 1).padStart(2, '0')}</span>
              <span
                className={`lab-dot${
                  variant.id === 'current' ? ' is-current' : ' is-proposed'
                }`}
              />
              <span className="lab-variant-label">{variant.label}</span>
              <span className="lab-variant-tag">{variant.tag}</span>
            </div>

            <div className="lab-canvas-wrap">
              <LabViewport
                id={`${proposal.id}-${variant.id}`}
                camera={variant.camera ?? proposal.camera}
                onReady={handleReady}
              >
                {variant.render()}
              </LabViewport>
            </div>

            <p className="lab-caption">{variant.description}</p>
          </section>
        ))}
      </main>

      {!shot && proposal.notes && (
        <section className="lab-notes">
          <article>
            <h2>Changes</h2>
            <ul>
              {proposal.notes.changed.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article>
            <h2>Unchanged</h2>
            <ul>
              {proposal.notes.unchanged.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article>
            <h2>Open decisions</h2>
            <ul>
              {proposal.notes.decisions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        </section>
      )}

      <footer className="lab-footer">
        <div className="lab-footer-left">
          <span className="lab-lock">NOT IN GAME</span>
          <span>
            No game runtime file was changed for this preview. Approve the PNG
            before the visual is committed to the game.
          </span>
        </div>

        <div className="lab-footer-right">
          <span className="lab-footer-label">CAPTURE</span>
          <code>npm run preview -- {proposal.id} --open</code>
        </div>
      </footer>
    </div>
  );
}

export default GraphicsLab;
