"use client";

import { useState } from "react";
import type { ProfileVerification, Verdict } from "@/lib/types";

type Preset = { label: string; tag: string; handle: string; skills: string; hint: string };

const PRESETS: Preset[] = [
  {
    label: "Real senior dev",
    tag: "→ verified",
    handle: "leerob",
    skills: "Next.js:since 2020, TypeScript, Self-hosting, Technical writing",
    hint: "Authored commits + a live deploy back every claim.",
  },
  {
    label: "Honeypot",
    tag: "→ contradicted",
    handle: "leerob",
    skills: "Next.js:since 2010",
    hint: "Claimed start predates the account — chronologically impossible.",
  },
  {
    label: "Keyword-stuffer",
    tag: "→ unverified",
    handle: "ghost-candidate-2026-xyz",
    skills: "React, Kubernetes, Terraform, PyTorch, GraphQL",
    hint: "Dense buzzwords, zero discoverable artifacts.",
  },
];

const VERDICT: Record<Verdict, { pill: string; ring: string; label: string }> = {
  verified: { pill: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", ring: "ring-emerald-500/30", label: "VERIFIED" },
  unverified: { pill: "bg-amber-500/15 text-amber-300 ring-amber-500/30", ring: "ring-amber-500/25", label: "UNVERIFIED" },
  contradicted: { pill: "bg-rose-500/15 text-rose-300 ring-rose-500/30", ring: "ring-rose-500/30", label: "CONTRADICTED" },
};

function parseSkills(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [skill, since] = s.split(":").map((x) => x.trim());
      const m = since?.match(/(\d{4})/);
      return m ? { skill, claimedSince: m[1] } : { skill };
    });
}

export default function Home() {
  const [handle, setHandle] = useState("leerob");
  const [skills, setSkills] = useState("Next.js:since 2020, TypeScript, Self-hosting, Technical writing");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(h = handle, s = skills) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubHandle: h, claims: parseSkills(s) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <header>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5">Pramaan · प्रमाण</span>
            <span>proof-of-work for skills</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Stop scoring what a candidate <span className="text-zinc-500">wrote.</span>
            <br />
            Score the <span className="text-emerald-400">evidence</span> they point at.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            A claim is only as real as the artifact behind it. Pramaan checks each claimed skill
            against authored commits, live deployments, and published work — then cites the receipt
            or marks it unverified.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-zinc-500">
          {["Resolve artifacts", "Reconcile vs claim", "Cite or reject"].map((s, i) => (
            <div key={s} className="rounded-lg border border-zinc-800 px-2 py-3">
              <div className="text-zinc-300">{i + 1}</div>
              <div className="mt-1">{s}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setHandle(p.handle);
                  setSkills(p.skills);
                  void run(p.handle, p.skills);
                }}
                title={p.hint}
                className="group rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                {p.label} <span className="text-zinc-500 group-hover:text-zinc-400">{p.tag}</span>
              </button>
            ))}
          </div>

          <label className="block text-xs uppercase tracking-wide text-zinc-500">GitHub handle</label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">
            Claimed skills — comma separated, optional <code className="text-zinc-400">:since YEAR</code>
          </label>
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <button
            onClick={() => run()}
            disabled={loading}
            className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-900 transition hover:bg-white disabled:opacity-50"
          >
            {loading ? "Checking the receipts…" : "Verify"}
          </button>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">{error}</p>
        )}

        {result && (
          <section className="mt-8">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
              <div>
                <div className="text-lg font-medium">@{result.handle}</div>
                <div className="text-sm text-zinc-500">{result.summary}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold tabular-nums">{Math.round(result.trustScore * 100)}%</div>
                <div className="text-xs text-zinc-500">trust · {result.elapsedMs}ms</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {result.cards.map((card) => {
                const v = VERDICT[card.verdict];
                return (
                  <article key={card.skill} className={`rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 ring-1 ${v.ring}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{card.skill}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${v.pill}`}>{v.label}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-300">{card.reason}</p>
                    {card.citedArtifacts.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-zinc-800 pt-3 text-xs">
                        {card.citedArtifacts.map((a) => (
                          <li key={a.url} className="flex gap-2">
                            <span className="text-zinc-600">{a.kind}</span>
                            <a href={a.url} target="_blank" rel="noreferrer" className="text-zinc-300 underline decoration-zinc-700 hover:decoration-zinc-400">
                              {a.title ?? a.url}
                            </a>
                            {a.detail && <span className="text-zinc-600">— {a.detail}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {card.flags.length > 0 && (
                      <div className="mt-2 text-xs text-amber-400/80">⚑ {card.flags.join(" · ")}</div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-16 border-t border-zinc-800 pt-6 text-xs text-zinc-600">
          Pramaan — a trust layer for Redrob. Verdicts are deterministic (date + authorship logic);
          the cited reason is the only LLM-written part, and it can never change a verdict.
        </footer>
      </main>
    </div>
  );
}
