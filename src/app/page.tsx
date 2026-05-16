"use client";

import { useMemo, useState, type ReactNode } from "react";
import { formatCurrency, formatFeetInches, formatPercent } from "@/lib/cutsheet/format";
import { SAMPLE_DECK_SCOPE } from "@/lib/cutsheet/mock";
import {
  CutSheetFlowError,
  runCutSheetStages,
  validateScopeText,
  type CutSheetPhase,
  type CutSheetStageError,
} from "@/lib/cutsheet/staged-flow";
import type { DoubleCheckItem, EstimatorSummary, ExtractionResult, OptimizationResult } from "@/lib/cutsheet/types";

const STAGES = [
  { phase: "extracting", eyebrow: "Stage 01", title: "Claude extraction", detail: "POST /api/extract parses the deck scope into cut requirements." },
  { phase: "optimizing", eyebrow: "Stage 02", title: "Browser optimization", detail: "Run First Fit Decreasing layouts against local stock fixtures." },
  { phase: "summarizing", eyebrow: "Stage 03", title: "Claude estimator summary", detail: "POST /api/summarize turns extracted cuts and layouts into estimator guidance." },
] as const;

const severityStyles: Record<DoubleCheckItem["severity"], string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  review: "border-violet-200 bg-violet-50 text-violet-950",
};

const runningPhases = new Set<CutSheetPhase>(["extracting", "optimizing", "summarizing"]);

export default function Home() {
  const [scopeText, setScopeText] = useState(SAMPLE_DECK_SCOPE);
  const [validationMessage, setValidationMessage] = useState("");
  const [phase, setPhase] = useState<CutSheetPhase>("idle");
  const [error, setError] = useState<CutSheetStageError | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [summary, setSummary] = useState<EstimatorSummary | null>(null);

  const isRunning = runningPhases.has(phase);
  const completedStages = useMemo(
    () => ({
      extracting: Boolean(extraction),
      optimizing: Boolean(optimization),
      summarizing: Boolean(summary),
    }),
    [extraction, optimization, summary],
  );

  const handleRun = async () => {
    const localValidation = validateScopeText(scopeText);
    if (localValidation) {
      setPhase("idle");
      setValidationMessage(localValidation);
      setError(null);
      return;
    }

    setValidationMessage("");
    setError(null);
    setExtraction(null);
    setOptimization(null);
    setSummary(null);

    try {
      await runCutSheetStages(scopeText, {
        onPhaseChange: setPhase,
        onExtraction: setExtraction,
        onOptimization: setOptimization,
        onSummary: setSummary,
      });
    } catch (caught) {
      const stageError =
        caught instanceof CutSheetFlowError
          ? caught.toStageError()
          : {
              phase: phase === "optimizing" || phase === "summarizing" ? phase : "extracting",
              code: "CUTSHEET_FLOW_FAILED",
              message: "The CutSheet flow failed before it could complete.",
            } satisfies CutSheetStageError;

      setError(stageError);
      setPhase("error");
    }
  };

  const handleLoadSample = () => {
    setScopeText(SAMPLE_DECK_SCOPE);
    setValidationMessage("");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_36%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)] px-5 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-700">Atreyus CutSheet Demo</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Real deck scope to browser-optimized lumber order.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              This staged flow calls Claude-backed extraction first, optimizes the returned cuts in the browser, then sends both artifacts to the Claude-backed estimator summary endpoint. Each completed upstream stage remains visible if a downstream stage fails.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-inner">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">Run status</p>
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Current phase</p>
              <p className="mt-1 text-2xl font-black capitalize">{phase}</p>
              {error ? (
                <p className="mt-2 text-sm font-semibold text-red-200">
                  Failed during {error.phase}: {error.code}
                </p>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3">
              {STAGES.map((stage, index) => (
                <div key={stage.title} className="flex gap-3 rounded-2xl bg-white/10 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-400 text-sm font-black text-slate-950">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">{stage.eyebrow}</p>
                      <StageStatusBadge active={phase === stage.phase} complete={completedStages[stage.phase]} failed={error?.phase === stage.phase} />
                    </div>
                    <p className="font-semibold">{stage.title}</p>
                    <p className="text-sm leading-6 text-slate-300">{stage.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-lg shadow-slate-200/70 backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Input</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Deck scope</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Empty input is blocked locally. A run performs exactly two sequential API requests: extract, then summarize after browser optimization succeeds.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isRunning}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Load sample scope
              </button>
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="rounded-full bg-blue-700 px-5 py-2 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-wait disabled:bg-blue-400"
              >
                {isRunning ? "Running staged flow…" : "Run staged flow"}
              </button>
            </div>
          </div>
          <textarea
            value={scopeText}
            onChange={(event) => setScopeText(event.target.value)}
            className="mt-5 min-h-36 w-full resize-y rounded-3xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-800 outline-none ring-blue-500/20 transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4"
            aria-label="Deck scope"
            placeholder="Describe the deck scope to estimate..."
            disabled={isRunning}
          />
          {validationMessage ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
              {validationMessage}
            </div>
          ) : null}
        </section>

        {error ? <ErrorPanel error={error} hasExtraction={Boolean(extraction)} hasOptimization={Boolean(optimization)} /> : null}

        {extraction ? (
          <div className="grid gap-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 md:p-6">
              <StageHeading eyebrow="Stage 01" title="Claude extraction" detail="Validated response from /api/extract." />
              <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="overflow-x-auto rounded-3xl border border-slate-200">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Cut</th>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Length</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extraction.cuts.map((cut) => (
                        <tr key={cut.id} className="align-top">
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900">{cut.label}</p>
                            {cut.notes ? <p className="mt-1 text-xs leading-5 text-slate-500">{cut.notes}</p> : null}
                          </td>
                          <td className="px-4 py-4 font-semibold">{cut.nominalSize}</td>
                          <td className="px-4 py-4">{formatFeetInches(cut.lengthInches)}</td>
                          <td className="px-4 py-4">{cut.quantity}</td>
                          <td className="px-4 py-4 capitalize">{cut.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid content-start gap-4">
                  <InfoPanel title="Assumptions">
                    {extraction.assumptions.length ? (
                      <ul className="grid gap-3">
                        {extraction.assumptions.map((assumption) => (
                          <li key={assumption.id} className="rounded-2xl bg-slate-50 p-3">
                            <p className="font-bold">{assumption.label}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{assumption.detail}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState>No extraction assumptions returned.</EmptyState>
                    )}
                  </InfoPanel>
                  <InfoPanel title="Extraction warnings">
                    {extraction.warnings.length ? (
                      <ul className="grid gap-2 text-sm leading-6 text-slate-700">
                        {extraction.warnings.map((warning) => (
                          <li key={warning}>• {warning}</li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState>No extraction warnings returned.</EmptyState>
                    )}
                  </InfoPanel>
                </div>
              </div>
            </section>

            {optimization ? <OptimizationSection optimization={optimization} /> : null}
            {summary ? <SummarySection summary={summary} /> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function StageStatusBadge({ active, complete, failed }: { active: boolean; complete: boolean; failed: boolean }) {
  const label = failed ? "failed" : complete ? "complete" : active ? "running" : "pending";
  const classes = failed
    ? "bg-red-200 text-red-950"
    : complete
      ? "bg-emerald-200 text-emerald-950"
      : active
        ? "bg-blue-200 text-blue-950"
        : "bg-white/15 text-slate-300";

  return <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.14em] ${classes}`}>{label}</span>;
}

function ErrorPanel({ error, hasExtraction, hasOptimization }: { error: CutSheetStageError; hasExtraction: boolean; hasOptimization: boolean }) {
  return (
    <section className="rounded-[2rem] border border-red-200 bg-red-50 p-5 shadow-lg shadow-red-100/60 md:p-6" role="alert">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-red-700">Flow failed</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-red-950">{error.phase} stage stopped the run.</h2>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-red-950 md:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-2xl border border-red-200 bg-white/70 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">Stable code</p>
          <p className="mt-1 font-mono text-sm font-bold">{error.code}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-white/70 p-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">Message</p>
          <p className="mt-1 font-semibold">{error.message}</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-red-900">
        Upstream preservation: extraction {hasExtraction ? "is visible below" : "did not complete"}; optimization {hasOptimization ? "is visible below" : "did not complete"}. Provider internals, raw responses, stack traces, and API keys are not shown in the browser.
      </p>
    </section>
  );
}

function OptimizationSection({ optimization }: { optimization: OptimizationResult }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 md:p-6">
      <StageHeading eyebrow="Stage 02" title="Browser optimization" detail="Real optimizeCuts(extraction.cuts) output rendered for review." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Material cost" value={formatCurrency(optimization.totals.materialCost)} />
        <Metric label="Boards to buy" value={optimization.totals.boards.toString()} />
        <Metric label="Placed cuts" value={`${optimization.totals.placedCuts}/${optimization.totals.requiredCuts}`} />
        <Metric label="Waste" value={formatPercent(optimization.totals.wastePercent)} detail={formatFeetInches(optimization.totals.wasteInches)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-5">
          <InfoPanel title="Purchase list">
            {optimization.purchaseList.length ? (
              <div className="grid gap-3">
                {optimization.purchaseList.map((line) => (
                  <div key={line.stockId} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div>
                      <p className="font-bold">{line.label}</p>
                      <p className="text-sm text-slate-600">
                        {line.quantity} × {formatCurrency(line.unitCost)} · {formatFeetInches(line.lengthInches)}
                      </p>
                    </div>
                    <p className="font-black">{formatCurrency(line.totalCost)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No stock purchases were produced.</EmptyState>
            )}
          </InfoPanel>

          <InfoPanel title="Manual review / unplaced cuts">
            {optimization.unplacedCuts.length === 0 ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-800">
                No unplaced cuts in this run. Keep this panel visible so oversize, malformed, or unsupported future cuts have a deterministic review surface.
              </p>
            ) : (
              <ul className="grid gap-3">
                {optimization.unplacedCuts.map((cut) => (
                  <li key={`${cut.requiredCutId}-${cut.reason}`} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                    <p className="font-black">{cut.label}</p>
                    <p>{cut.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </InfoPanel>
        </div>

        <div className="grid gap-4">
          {optimization.layouts.map((layout) => (
            <article key={layout.id} className="rounded-3xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black text-slate-950">{layout.stock.label}</h3>
                  <p className="text-sm text-slate-600">
                    Used {formatFeetInches(layout.usedInches)} · Leftover {formatFeetInches(layout.wasteInches)} · {formatCurrency(layout.cost)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                  {layout.id}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {layout.placedCuts.map((cut) => (
                  <span key={`${layout.id}-${cut.requiredCutId}-${cut.instance}`} className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-950">
                    {cut.label} #{cut.instance} · {formatFeetInches(cut.lengthInches)}
                  </span>
                ))}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  leftover · {formatFeetInches(layout.wasteInches)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummarySection({ summary }: { summary: EstimatorSummary }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 md:p-6">
      <StageHeading eyebrow="Stage 03" title={summary.title} detail={summary.overview} />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <InfoPanel title="Cost guidance">
          <div className="grid gap-3">
            {summary.materialLines.map((line) => (
              <div key={line.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-bold">{line.label}</p>
                  <p className="font-black">{formatCurrency(line.totalCost)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {line.quantity} {line.unit} at {formatCurrency(line.unitCost)}
                </p>
              </div>
            ))}
          </div>
        </InfoPanel>
        <InfoPanel title="Labor notes">
          <ul className="grid gap-3 text-sm leading-6 text-slate-700">
            {summary.laborNotes.map((note) => (
              <li key={note} className="rounded-2xl bg-slate-50 p-3">
                {note}
              </li>
            ))}
          </ul>
        </InfoPanel>
        <InfoPanel title="Double-checks">
          <div className="grid gap-3">
            {summary.doubleChecks.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-3 ${severityStyles[item.severity]}`}>
                <p className="text-xs font-black uppercase tracking-[0.16em]">{item.severity}</p>
                <p className="mt-1 font-black">{item.title}</p>
                <p className="mt-1 text-sm leading-6">{item.detail}</p>
              </div>
            ))}
          </div>
        </InfoPanel>
      </div>
      <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
        {summary.disclaimer}
      </p>
    </section>
  );
}

function StageHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-sm font-semibold text-slate-500">{detail}</p> : null}
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">{children}</p>;
}
