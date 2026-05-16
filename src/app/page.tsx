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
import type {
  CutSource,
  DoubleCheckItem,
  EstimatorSummary,
  ExtractionResult,
  OptimizationResult,
} from "@/lib/cutsheet/types";

// ── Design tokens ──────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<CutSource, string> = {
  beam:     "#f59e0b",
  joist:    "#60a5fa",
  rim:      "#34d399",
  post:     "#f87171",
  blocking: "#a78bfa",
  stair:    "#fb923c",
  misc:     "#71717a",
};

const SEVERITY_STYLES: Record<DoubleCheckItem["severity"], { wrap: string; label: string }> = {
  info:    { wrap: "border-blue-800/60   bg-blue-950/30   text-blue-200",   label: "INFO"    },
  warning: { wrap: "border-amber-800/60  bg-amber-950/30  text-amber-200",  label: "WARNING" },
  review:  { wrap: "border-violet-800/60 bg-violet-950/30 text-violet-200", label: "REVIEW"  },
};

const STAGES = [
  { phase: "extracting"  as const, label: "Claude extraction"        },
  { phase: "optimizing"  as const, label: "Browser optimization"     },
  { phase: "summarizing" as const, label: "Claude estimator summary"  },
];

const RUNNING_PHASES = new Set<CutSheetPhase>(["extracting", "optimizing", "summarizing"]);

// ── Root ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const [scopeText, setScopeText]                 = useState(SAMPLE_DECK_SCOPE);
  const [validationMessage, setValidationMessage] = useState("");
  const [phase, setPhase]                         = useState<CutSheetPhase>("idle");
  const [error, setError]                         = useState<CutSheetStageError | null>(null);
  const [extraction, setExtraction]               = useState<ExtractionResult | null>(null);
  const [optimization, setOptimization]           = useState<OptimizationResult | null>(null);
  const [summary, setSummary]                     = useState<EstimatorSummary | null>(null);

  const isRunning = RUNNING_PHASES.has(phase);
  const completedStages = useMemo(
    () => ({
      extracting:  Boolean(extraction),
      optimizing:  Boolean(optimization),
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
        onPhaseChange:  setPhase,
        onExtraction:   setExtraction,
        onOptimization: setOptimization,
        onSummary:      setSummary,
      });
    } catch (caught) {
      const stageError =
        caught instanceof CutSheetFlowError
          ? caught.toStageError()
          : ({
              phase:   phase === "optimizing" || phase === "summarizing" ? phase : "extracting",
              code:    "CUTSHEET_FLOW_FAILED",
              message: "The CutSheet flow failed before it could complete.",
            } satisfies CutSheetStageError);
      setError(stageError);
      setPhase("error");
    }
  };

  const handleLoadSample = () => {
    setScopeText(SAMPLE_DECK_SCOPE);
    setValidationMessage("");
  };

  return (
    <div className="min-h-[100dvh] bg-[#0d0d0d] text-[#e8e8e8]">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-14">

        {/* ── Header ── */}
        <header className="mb-12 grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col justify-center">
            <p className="mb-6 font-['Geist_Mono'] text-[10px] font-medium uppercase tracking-[0.3em] text-amber-500">
              Atreyus CutSheet Demo
            </p>
            <h1 className="mb-5 text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl">
              Deck scope in.<br className="hidden sm:block" />
              Lumber order out.
            </h1>
            <p className="max-w-[50ch] text-base leading-relaxed text-zinc-400">
              Describe a deck in plain English. Claude extracts every cut,
              the browser packs boards against stock fixtures, Claude writes
              the estimator summary.
            </p>
          </div>

          <RunStatusPanel
            phase={phase}
            error={error}
            isRunning={isRunning}
            completedStages={completedStages}
          />
        </header>

        {/* ── Divider ── */}
        <div className="mb-8 border-t border-zinc-800" />

        {/* ── Input ── */}
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-full w-[2px] self-stretch bg-amber-500" />
              <div>
                <p className="font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.3em] text-zinc-500">
                  Input
                </p>
                <h2 className="text-lg font-bold tracking-tight text-white">Deck scope</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isRunning}
                className="border border-zinc-700 px-4 py-2 font-['Geist_Mono'] text-xs font-medium uppercase tracking-[0.12em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Load sample
              </button>
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="bg-amber-500 px-5 py-2 font-['Geist_Mono'] text-xs font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:bg-amber-400 active:bg-amber-600 disabled:cursor-wait disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                {isRunning ? "Running…" : "Run staged flow"}
              </button>
            </div>
          </div>
          <textarea
            value={scopeText}
            onChange={(e) => setScopeText(e.target.value)}
            className="min-h-28 w-full resize-y border border-zinc-800 bg-zinc-950/60 p-4 font-['Geist_Mono'] text-sm leading-7 text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-500/40 focus:bg-zinc-950 disabled:opacity-50"
            aria-label="Deck scope"
            placeholder="Describe the deck scope to estimate…"
            disabled={isRunning}
          />
          {validationMessage && (
            <div
              className="mt-2 border border-red-800/60 bg-red-950/30 px-4 py-3 font-['Geist_Mono'] text-xs font-medium text-red-300"
              role="alert"
            >
              {validationMessage}
            </div>
          )}
        </section>

        {/* ── Flow error ── */}
        {error && (
          <ErrorBanner
            error={error}
            hasExtraction={Boolean(extraction)}
            hasOptimization={Boolean(optimization)}
          />
        )}

        {/* ── Stage results ── */}
        {extraction && (
          <div className="anim-fade-up space-y-12">
            <ExtractionSection extraction={extraction} />
            {optimization && <OptimizationSection optimization={optimization} />}
            {summary && <SummarySection summary={summary} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Run Status Panel ───────────────────────────────────────────────────────────

function RunStatusPanel({
  phase,
  error,
  isRunning,
  completedStages,
}: {
  phase: CutSheetPhase;
  error: CutSheetStageError | null;
  isRunning: boolean;
  completedStages: Record<"extracting" | "optimizing" | "summarizing", boolean>;
}) {
  const allDone = completedStages.summarizing;

  const phaseColor = isRunning
    ? "text-amber-400"
    : phase === "error"
    ? "text-red-400"
    : allDone
    ? "text-emerald-400"
    : "text-zinc-500";

  return (
    <div className="border border-zinc-800 bg-zinc-950/40 p-5">
      <p className="mb-4 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.3em] text-zinc-500">
        Run status
      </p>

      <div className="mb-5 flex items-center gap-3">
        <span
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
            isRunning
              ? "bg-amber-500 pulse-amber"
              : phase === "error"
              ? "bg-red-500"
              : allDone
              ? "bg-emerald-500"
              : "bg-zinc-700"
          }`}
        />
        <p className={`font-['Geist_Mono'] text-lg font-bold uppercase tracking-tight ${phaseColor}`}>
          {phase}
        </p>
        {error && (
          <span className="border border-red-800/50 bg-red-950/50 px-2 py-0.5 font-['Geist_Mono'] text-[9px] font-medium text-red-400">
            {error.code}
          </span>
        )}
      </div>

      <div className="space-y-px">
        {STAGES.map((stage, i) => {
          const isActive   = phase === stage.phase;
          const isComplete = completedStages[stage.phase];
          const isFailed   = error?.phase === stage.phase;

          return (
            <div
              key={stage.phase}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                isActive
                  ? "border-l-2 border-amber-500 bg-amber-500/[0.06]"
                  : isComplete
                  ? "border-l-2 border-emerald-500 bg-emerald-500/[0.04]"
                  : isFailed
                  ? "border-l-2 border-red-500 bg-red-500/[0.06]"
                  : "border-l-2 border-transparent"
              }`}
            >
              <span
                className={`font-['Geist_Mono'] text-xs font-bold tabular-nums ${
                  isActive ? "text-amber-400" : isComplete ? "text-emerald-400" : isFailed ? "text-red-400" : "text-zinc-600"
                }`}
              >
                0{i + 1}
              </span>
              <span
                className={`flex-1 text-sm ${
                  isActive ? "font-medium text-zinc-200" : isComplete ? "text-zinc-400" : isFailed ? "text-red-300" : "text-zinc-600"
                }`}
              >
                {stage.label}
              </span>
              <StageBadge active={isActive} complete={isComplete} failed={isFailed} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Error Banner ───────────────────────────────────────────────────────────────

function ErrorBanner({
  error,
  hasExtraction,
  hasOptimization,
}: {
  error: CutSheetStageError;
  hasExtraction: boolean;
  hasOptimization: boolean;
}) {
  return (
    <div className="mb-10 border border-red-800/50 bg-red-950/20 p-6" role="alert">
      <p className="mb-2 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.3em] text-red-500">
        Flow failed
      </p>
      <h2 className="mb-4 text-2xl font-black tracking-tight text-red-200">
        {error.phase} stage stopped the run.
      </h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="border border-red-800/40 bg-red-950/40 p-3">
          <p className="mb-1 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.25em] text-red-500">
            Error code
          </p>
          <p className="font-['Geist_Mono'] text-sm font-bold text-red-300">{error.code}</p>
        </div>
        <div className="border border-red-800/40 bg-red-950/40 p-3">
          <p className="mb-1 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.25em] text-red-500">
            Message
          </p>
          <p className="text-sm text-red-300">{error.message}</p>
        </div>
      </div>
      <p className="font-['Geist_Mono'] text-[10px] leading-6 text-red-500/60">
        Extraction {hasExtraction ? "preserved below" : "did not complete"} · Optimization{" "}
        {hasOptimization ? "preserved below" : "did not complete"}
      </p>
    </div>
  );
}

// ── Stage 01 — Extraction ──────────────────────────────────────────────────────

function ExtractionSection({ extraction }: { extraction: ExtractionResult }) {
  return (
    <section>
      <SectionHeader eyebrow="Stage 01" title="Claude extraction" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">

        {/* Cuts table */}
        <div className="overflow-x-auto border border-zinc-800">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                {["Cut", "Size", "Length", "Qty", "Source"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.25em] text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {extraction.cuts.map((cut) => (
                <tr key={cut.id} className="align-top transition-colors hover:bg-zinc-900/40">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-100">{cut.label}</p>
                    {cut.notes && (
                      <p className="mt-0.5 text-xs leading-5 text-zinc-500">{cut.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-['Geist_Mono'] text-xs font-medium text-zinc-300">
                      {cut.nominalSize}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-['Geist_Mono'] text-sm text-zinc-300">
                    {formatFeetInches(cut.lengthInches)}
                  </td>
                  <td className="px-4 py-3.5 font-['Geist_Mono'] font-bold text-zinc-100">
                    {cut.quantity}
                  </td>
                  <td className="px-4 py-3.5 font-['Geist_Mono'] text-xs capitalize text-zinc-500">
                    {cut.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assumptions + Warnings */}
        <div className="flex flex-col gap-4">
          <Panel title="Assumptions">
            {extraction.assumptions.length ? (
              <div className="space-y-2">
                {extraction.assumptions.map((a) => (
                  <div key={a.id} className="border border-zinc-800/60 p-3">
                    <p className="text-sm font-medium text-zinc-200">{a.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-zinc-500">{a.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No assumptions returned.</EmptyState>
            )}
          </Panel>

          {extraction.warnings.length > 0 && (
            <div className="border border-amber-800/40 bg-amber-950/15 p-4">
              <p className="mb-3 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.3em] text-amber-600">
                Warnings
              </p>
              <ul className="space-y-1.5">
                {extraction.warnings.map((w) => (
                  <li key={w} className="font-['Geist_Mono'] text-xs leading-5 text-amber-300/80">
                    — {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Stage 02 — Optimization ───────────────────────────────────────────────────

function OptimizationSection({ optimization }: { optimization: OptimizationResult }) {
  return (
    <section>
      <SectionHeader eyebrow="Stage 02" title="Browser optimization" />

      {/* Metrics — border-separated strip */}
      <div className="mt-5 grid grid-cols-2 divide-x divide-zinc-800 border border-zinc-800 md:grid-cols-4">
        <MetricCell label="Material cost" value={formatCurrency(optimization.totals.materialCost)} />
        <MetricCell label="Boards to buy" value={optimization.totals.boards.toString()} />
        <MetricCell
          label="Placed cuts"
          value={`${optimization.totals.placedCuts}/${optimization.totals.requiredCuts}`}
        />
        <MetricCell
          label="Waste"
          value={formatPercent(optimization.totals.wastePercent)}
          sub={formatFeetInches(optimization.totals.wasteInches)}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">

        {/* Purchase list + unplaced */}
        <div className="flex flex-col gap-4">
          <Panel title="Purchase list">
            {optimization.purchaseList.length ? (
              <div className="space-y-2">
                {optimization.purchaseList.map((line) => (
                  <div
                    key={line.stockId}
                    className="flex items-center justify-between gap-4 border border-zinc-800/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{line.label}</p>
                      <p className="mt-0.5 font-['Geist_Mono'] text-xs text-zinc-500">
                        {line.quantity} × {formatCurrency(line.unitCost)} ·{" "}
                        {formatFeetInches(line.lengthInches)}
                      </p>
                    </div>
                    <p className="shrink-0 font-['Geist_Mono'] text-sm font-bold text-amber-400">
                      {formatCurrency(line.totalCost)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No stock purchases produced.</EmptyState>
            )}
          </Panel>

          <div
            className={`border p-4 ${
              optimization.unplacedCuts.length === 0
                ? "border-emerald-800/30 bg-emerald-950/10"
                : "border-amber-800/30 bg-amber-950/10"
            }`}
          >
            <p
              className={`mb-3 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.3em] ${
                optimization.unplacedCuts.length === 0 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              Unplaced cuts
            </p>
            {optimization.unplacedCuts.length === 0 ? (
              <p className="font-['Geist_Mono'] text-xs font-medium text-emerald-400">
                All cuts placed successfully.
              </p>
            ) : (
              <ul className="space-y-2">
                {optimization.unplacedCuts.map((cut) => (
                  <li
                    key={`${cut.requiredCutId}-${cut.reason}`}
                    className="border border-amber-800/30 bg-amber-950/20 p-3"
                  >
                    <p className="text-xs font-bold text-amber-300">{cut.label}</p>
                    <p className="mt-0.5 font-['Geist_Mono'] text-xs text-amber-400/70">
                      {cut.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Board layouts with visual cut bars */}
        <div className="space-y-3">
          {optimization.layouts.map((layout) => (
            <article key={layout.id} className="border border-zinc-800 p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-zinc-100">{layout.stock.label}</p>
                  <p className="mt-0.5 font-['Geist_Mono'] text-xs text-zinc-500">
                    Used {formatFeetInches(layout.usedInches)} · Waste{" "}
                    {formatFeetInches(layout.wasteInches)} · {formatCurrency(layout.cost)}
                  </p>
                </div>
                <span className="shrink-0 border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-['Geist_Mono'] text-[9px] text-zinc-500">
                  {layout.id}
                </span>
              </div>

              {/* Visual board bar — colour coded by cut source */}
              <div className="flex h-4 overflow-hidden bg-zinc-800">
                {layout.placedCuts.map((cut) => (
                  <div
                    key={`${cut.requiredCutId}-${cut.instance}`}
                    style={{
                      width: `${(cut.lengthInches / layout.stock.lengthInches) * 100}%`,
                      backgroundColor: SOURCE_COLORS[cut.source],
                      opacity: 0.75,
                    }}
                    className="h-full border-r border-[#0d0d0d] last:border-r-0 transition-opacity hover:opacity-100"
                    title={`${cut.label} · ${formatFeetInches(cut.lengthInches)}`}
                  />
                ))}
                {layout.wasteInches > 0 && (
                  <div
                    style={{
                      width: `${(layout.wasteInches / layout.stock.lengthInches) * 100}%`,
                    }}
                    className="h-full bg-zinc-700/40"
                    title={`Waste · ${formatFeetInches(layout.wasteInches)}`}
                  />
                )}
              </div>

              {/* Cut chips */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {layout.placedCuts.map((cut) => (
                  <span
                    key={`${cut.requiredCutId}-${cut.instance}`}
                    className="border border-zinc-700/60 bg-zinc-900 px-2 py-0.5 font-['Geist_Mono'] text-xs text-zinc-300"
                  >
                    {cut.label} #{cut.instance}
                    <span className="ml-1 text-zinc-600">· {formatFeetInches(cut.lengthInches)}</span>
                  </span>
                ))}
                <span className="border border-zinc-800 px-2 py-0.5 font-['Geist_Mono'] text-xs text-zinc-600">
                  waste · {formatFeetInches(layout.wasteInches)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stage 03 — Summary ────────────────────────────────────────────────────────

function SummarySection({ summary }: { summary: EstimatorSummary }) {
  return (
    <section>
      <SectionHeader eyebrow="Stage 03" title={summary.title} detail={summary.overview} />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">

        <Panel title="Cost guidance">
          <div className="space-y-2">
            {summary.materialLines.map((line) => (
              <div key={line.id} className="border border-zinc-800/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-200">{line.label}</p>
                  <p className="shrink-0 font-['Geist_Mono'] text-sm font-bold text-amber-400">
                    {formatCurrency(line.totalCost)}
                  </p>
                </div>
                <p className="mt-0.5 font-['Geist_Mono'] text-xs text-zinc-500">
                  {line.quantity} {line.unit} at {formatCurrency(line.unitCost)}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Labor notes">
          <ul className="space-y-2">
            {summary.laborNotes.map((note) => (
              <li
                key={note}
                className="border border-zinc-800/60 p-3 text-xs leading-5 text-zinc-400"
              >
                {note}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Double-checks">
          <div className="space-y-2">
            {summary.doubleChecks.map((item) => {
              const s = SEVERITY_STYLES[item.severity];
              return (
                <div key={item.id} className={`border p-3 ${s.wrap}`}>
                  <p className="mb-1 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.25em] opacity-60">
                    {s.label}
                  </p>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 opacity-75">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <p className="mt-4 border border-zinc-800 px-5 py-4 font-['Geist_Mono'] text-xs leading-6 text-zinc-500">
        {summary.disclaimer}
      </p>
    </section>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 w-[2px] shrink-0 self-stretch bg-amber-500" />
      <div>
        <p className="mb-1.5 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.3em] text-amber-500">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
        {detail && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{detail}</p>
        )}
      </div>
    </div>
  );
}

function MetricCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-5 py-4">
      <p className="mb-1 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </p>
      <p className="font-['Geist_Mono'] text-2xl font-bold tracking-tight text-white">{value}</p>
      {sub && (
        <p className="mt-0.5 font-['Geist_Mono'] text-xs text-zinc-600">{sub}</p>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-zinc-800 p-4">
      <p className="mb-3 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.3em] text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function StageBadge({
  active,
  complete,
  failed,
}: {
  active: boolean;
  complete: boolean;
  failed: boolean;
}) {
  const label = failed ? "failed" : complete ? "done" : active ? "running" : "pending";
  const cls = failed
    ? "border-red-800/50    bg-red-950/50    text-red-400"
    : complete
    ? "border-emerald-800/50 bg-emerald-950/50 text-emerald-400"
    : active
    ? "border-amber-700/50  bg-amber-950/50  text-amber-400"
    : "border-zinc-700      bg-zinc-900      text-zinc-600";
  return (
    <span
      className={`border px-2 py-0.5 font-['Geist_Mono'] text-[9px] font-medium uppercase tracking-[0.12em] ${cls}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="border border-zinc-800/60 p-3 font-['Geist_Mono'] text-xs leading-5 text-zinc-600">
      {children}
    </p>
  );
}
