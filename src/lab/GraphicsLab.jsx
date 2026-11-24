// src/lab/GraphicsLab.jsx
//
// Dev-only review board. Open it with:
//   http://localhost:3000/The-Labyrinth-of-Catlantis/?lab=wall-openings
// Add &option=58 to focus one option, or &shot=1 for the deterministic PNG
// layout used by scripts/visual-preview.mjs.
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { LabViewport } from './LabStage';
import { PROPOSALS, getProposal } from './proposals';
import optionLedger from './option-ledger.json';
import './lab.css';

const STATUS_LABELS = {
  'awaiting-review': 'AWAITING REVIEW',
  approved: 'APPROVED — READY TO IMPLEMENT',
  implemented: 'IMPLEMENTED — PLAYTESTING',
  verified: 'VERIFIED',
  rejected: 'REJECTED',
};

const OPTION_STATUS_LABELS = {
  'awaiting-review': 'AWAITING REVIEW',
  approved: 'APPROVED',
  implemented: 'IMPLEMENTED',
  verified: 'VERIFIED',
  'not-selected': 'NOT SELECTED',
};

const OPTION_STATUS_SHORT = {
  'awaiting-review': 'REVIEW',
  approved: 'APPROVED',
  implemented: 'IMPLEMENTED',
  verified: 'VERIFIED',
  'not-selected': 'NOT SELECTED',
};

const optionLedgerEntry = (number) =>
  optionLedger.options.find((entry) => entry.number === number);

const getOptionStatus = (number) =>
  optionLedgerEntry(number)?.status ?? 'awaiting-review';

const optionStatusLabel = (status) =>
  OPTION_STATUS_LABELS[status] ?? String(status).toUpperCase();

const optionStatusShort = (status) =>
  OPTION_STATUS_SHORT[status] ?? String(status).toUpperCase();

const isPositiveStatus = (status) =>
  status === 'approved' || status === 'implemented' || status === 'verified';

const dateStamp = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('.');
};

const labHref = (id, option) => {
  const search = new URLSearchParams();
  search.set('lab', id);

  if (option) {
    search.set('option', String(option));
  }

  return `${window.location.pathname}?${search.toString()}`;
};

function ProposalIndex() {
  return (
    <div className="lab-root lab-root--index">
      <header className="lab-header">
        <div>
          <div className="lab-eyebrow">CATLANTIS <span>/</span> VISUAL LAB</div>
          <h1>Pick a proposal</h1>
          <p className="lab-subtitle">
            Three numbered options per visual idea. Numbers are global and never
            reused. Nothing here is in the game until you approve an option.
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
            No proposals yet. Run{' '}
            <code>npm run proposal:new -- &lt;slug&gt; "Title"</code> to allocate
            the next three option numbers.
          </p>
        )}

        {PROPOSALS.map((proposal) => (
          <a className="lab-index-card" href={labHref(proposal.id)} key={proposal.id}>
            <span className="lab-index-card-title">{proposal.title}</span>
            <span className="lab-index-card-sub">{proposal.subtitle}</span>
            <span className="lab-index-card-meta">
              <code>{proposal.id}</code>
              <span>
                OPTIONS {proposal.options.map((option) => option.number).join(' · ')} —{' '}
                {STATUS_LABELS[proposal.status] ?? proposal.status}
              </span>
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
  const requestedOption = Number.parseInt(params.get('option') || '', 10);
  const requestedView = params.get('view') || 'all';

  const proposal = requestedId
    ? getProposal(requestedId)
    : PROPOSALS.length === 1
      ? PROPOSALS[0]
      : null;

  const requestedOptionExists =
    proposal?.options.some((option) => option.number === requestedOption) ?? false;
  const initialMode = requestedOptionExists
    ? 'focus'
    : requestedView === 'current'
      ? 'current'
      : 'all';

  const [mode, setMode] = useState(initialMode);
  const [focusedNumber, setFocusedNumber] = useState(
    requestedOptionExists ? requestedOption : proposal?.options[0]?.number
  );
  const [readyIds, setReadyIds] = useState(() => new Set());

  const focusedOption =
    proposal?.options.find((option) => option.number === focusedNumber) ??
    proposal?.options[0];

  const activeViews = useMemo(() => {
    if (!proposal) {
      return [];
    }

    if (mode === 'current') {
      return [
        {
          key: 'current',
          kind: 'current',
          label: proposal.baseline.label,
          tag: proposal.baseline.tag,
          description: proposal.baseline.description,
          render: proposal.baseline.render,
          camera: proposal.camera,
          status: 'baseline',
        },
      ];
    }

    if (mode === 'focus' && focusedOption) {
      return [
        {
          key: `option-${focusedOption.number}`,
          kind: 'option',
          number: focusedOption.number,
          label: focusedOption.label,
          tag: `Option ${focusedOption.number}`,
          description: focusedOption.description,
          render: focusedOption.render,
          camera: proposal.camera,
          status: getOptionStatus(focusedOption.number),
        },
      ];
    }

    return proposal.options.map((option) => ({
      key: `option-${option.number}`,
      kind: 'option',
      number: option.number,
      label: option.label,
      tag: `Option ${option.number}`,
      description: option.description,
      render: option.render,
      camera: proposal.camera,
      status: getOptionStatus(option.number),
    }));
  }, [proposal, mode, focusedOption]);

  const viewKey = `${mode}:${activeViews.map((view) => view.key).join('|')}`;
  const allReady =
    activeViews.length > 0 && readyIds.size >= activeViews.length;

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

  const showOption = (number) => {
    setFocusedNumber(number);
    setMode('focus');
  };

  useEffect(() => {
    setReadyIds(new Set());
    window.__LAB_READY__ = false;

    return () => {
      window.__LAB_READY__ = false;
    };
  }, [proposal?.id, viewKey]);

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

    document.title =
      mode === 'focus' && focusedOption
        ? `${proposal.title} — Option ${focusedOption.number}`
        : mode === 'current'
          ? `${proposal.title} — Current`
          : `${proposal.title} — Options ${proposal.options
              .map((option) => option.number)
              .join(', ')}`;

    window.__LAB_INFO__ = {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      mode,
      focused: mode === 'focus' ? focusedOption?.number ?? null : null,
      options: proposal.options.map((option) => ({
        number: option.number,
        status: getOptionStatus(option.number),
      })),
      shot,
    };

    return () => {
      delete window.__LAB_INFO__;
      delete window.__LAB_READY__;
    };
  }, [proposal, mode, focusedOption, shot]);

  if (requestedId && !proposal) {
    return <MissingProposal id={requestedId} />;
  }

  if (!proposal) {
    return <ProposalIndex />;
  }

  if (!focusedOption) {
    return <MissingProposal id={proposal.id} />;
  }

  const statusLabel = STATUS_LABELS[proposal.status] ?? proposal.status;
  const today = dateStamp();
  const optionNumbers = proposal.options
    .map((option) => option.number)
    .join(' · ');
  const pngPath =
    mode === 'focus'
      ? `doc/proposals/${proposal.id}/${focusedOption.number}.png`
      : `doc/proposals/${proposal.id}/proposal.png`;
  const focusedStatus = getOptionStatus(focusedOption.number);

  return (
    <div className={`lab-root${shot ? ' lab-root--shot' : ''}`}>
      <header className="lab-header">
        <div className="lab-header-main">
          <div className="lab-eyebrow">CATLANTIS <span>/</span> VISUAL LAB</div>
          <h1>{proposal.title}</h1>
          <p className="lab-subtitle">{proposal.subtitle}</p>
        </div>

        <div className="lab-meta">
          <div className={`lab-status${isPositiveStatus(proposal.status) ? ' is-approved' : ''}`}>
            {statusLabel}
          </div>
          <div className="lab-meta-line">PROPOSAL <code>{proposal.id}</code></div>
          <div className="lab-meta-line">
            {mode === 'focus' ? (
              <>OPTION <code>{focusedOption.number}</code></>
            ) : mode === 'current' ? (
              'MODE CURRENT'
            ) : (
              <>OPTIONS <code>{optionNumbers}</code></>
            )}
          </div>
          <div className="lab-meta-line">DATE <code>{today}</code></div>
          <div className="lab-meta-line">PNG <code>{pngPath}</code></div>
        </div>
      </header>

      {!shot && (
        <div className="lab-controls" role="group" aria-label="Preview mode">
          <button
            className={`lab-control${mode === 'all' ? ' is-active' : ''}`}
            onClick={() => setMode('all')}
            type="button"
          >
            All 3
          </button>
          <button
            className={`lab-control${mode === 'current' ? ' is-active' : ''}`}
            onClick={() => setMode('current')}
            type="button"
          >
            Current
          </button>
          {proposal.options.map((option) => (
            <button
              className={`lab-control${
                mode === 'focus' && focusedNumber === option.number
                  ? ' is-active'
                  : ''
              }`}
              key={option.number}
              onClick={() => showOption(option.number)}
              type="button"
            >
              Option {option.number}
            </button>
          ))}
          <span className="lab-control-hint">
            Numbers are global. Reply with the option number you approve.
          </span>
        </div>
      )}

      {mode === 'focus' ? (
        <main className="lab-focus">
          <aside className="lab-focus-rail">
            <div className="lab-focus-kicker">OPTION</div>
            <div className="lab-focus-number">{focusedOption.number}</div>
            <h2 className="lab-focus-label">{focusedOption.label}</h2>
            <div
              className={`lab-option-status lab-focus-status${
                isPositiveStatus(focusedStatus) ? ' is-approved' : ''
              }`}
            >
              {optionStatusLabel(focusedStatus)}
            </div>
            <p className="lab-focus-description">
              {focusedOption.description}
            </p>

            <div className="lab-focus-baseline">
              <span>BASELINE</span>
              <p>{proposal.baseline.description}</p>
            </div>

            <div className="lab-focus-approve">
              Reply <code>{focusedOption.number} approved</code> to take this
              option into the game.
            </div>
          </aside>

          <section className="lab-focus-stage">
            <div className="lab-focus-canvas">
              <LabViewport
                id={activeViews[0].key}
                camera={activeViews[0].camera ?? proposal.camera}
                onReady={handleReady}
              >
                {focusedOption.render()}
              </LabViewport>
            </div>
            <p className="lab-caption">{focusedOption.description}</p>
          </section>
        </main>
      ) : (
        <main
          className={`lab-board${
            activeViews.length === 1 ? ' lab-board--single' : ''
          }`}
          style={{ '--variant-count': activeViews.length }}
        >
          {activeViews.map((view, index) => {
            const status = view.status ?? 'awaiting-review';

            return (
              <section className="lab-panel" key={view.key}>
                <div className="lab-panel-head">
                  <span className="lab-panel-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`lab-dot${
                      view.kind === 'current' ? ' is-current' : ' is-proposed'
                    }`}
                  />
                  <span className="lab-variant-label">
                    {view.kind === 'option'
                      ? `OPTION ${view.number}`
                      : 'CURRENT'}
                  </span>
                  <span className="lab-variant-tag">
                    {view.kind === 'option' ? view.label : view.tag}
                  </span>
                  <span
                    className={`lab-option-status${
                      isPositiveStatus(status) ? ' is-approved' : ''
                    }`}
                  >
                    {view.kind === 'current'
                      ? 'BASELINE'
                      : optionStatusShort(status)}
                  </span>
                </div>

                <div className="lab-canvas-wrap">
                  <LabViewport
                    id={view.key}
                    camera={view.camera ?? proposal.camera}
                    onReady={handleReady}
                  >
                    {view.render()}
                  </LabViewport>
                </div>

                <p className="lab-caption">{view.description}</p>
              </section>
            );
          })}
        </main>
      )}

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
            {mode === 'focus'
              ? `Option ${focusedOption.number} is a lab preview. Nothing in the game has changed.`
              : `Reply with the option number you approve: ${optionNumbers}. Nothing in the game has changed.`}
          </span>
        </div>

        <div className="lab-footer-right">
          <span className="lab-footer-label">CAPTURE</span>
          <code>
            {mode === 'focus'
              ? `npm run preview -- ${proposal.id} --option ${focusedOption.number}`
              : `npm run preview -- ${proposal.id}`}
          </code>
        </div>
      </footer>
    </div>
  );
}

export default GraphicsLab;
