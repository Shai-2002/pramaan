"use client";

import { useState } from "react";
import type { ProfileVerification, Verdict } from "@/lib/types";

type Preset = {
  label: string;
  handle: string;
  skills: string;
  hint: string;
};

const PRESETS: Preset[] = [
  {
    label: "Verified",
    handle: "leerob",
    skills: "Next.js, TypeScript, Self-hosting, Technical writing",
    hint: "Real authored commits + a live deploy back every claim.",
  },
  {
    label: "Contradicted (honeypot)",
    handle: "pramaan-demo-honeypot",
    skills: "React:since 2017, Kubernetes:since 2018",
    hint: "Account created 2026 — 8 years of React since 2017 is chronologically impossible.",
  },
  {
    label: "Unverified (keyword-stuffer)",
    handle: "ghost-candidate-2026",
    skills: "React, Kubernetes, Terraform, PyTorch, GraphQL",
    hint: "Dense buzzwords, zero discoverable artifacts.",
  },
];

const VERDICT_STYLE: Record<Verdict, string> = {
  verified: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
  unverified: "border-amber-500/40 bg-amber-500/5 text-amber-300",
  contradicted: "border-rose-500/40 bg-rose-500/5 text-rose-300",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  verified: "✓ VERIFIED",
  unverified: "⚠ UNVERIFIED",
  contradicted: "✕ CONTRADICTED",
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
  const [skills, setSkills] = useState("Next.js, TypeScript, Self-hosting");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubHandle: handle, claims: parseSkills(skills) }),
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
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-14 text-zinc-100">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">
          Pramaan <span className="text-zinc-500">/ प्रमाण</span>
        </h1>
        <p className="mt-2 text-zinc-400">
          Stop scoring what a candidate wrote. Score the evidence the profile points at.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setHandle(p.handle);
              setSkills(p.skills);
            }}
            className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:border-zinc-500"
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-zinc-800 p-4">
        <label className="block text-sm text-zinc-400">
          GitHub handle
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          Claimed skills (comma-separated; optional <code>:since YEAR</code>)
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-md bg-zinc-100 px-4 py-2 font-medium text-zinc-900 disabled:opacity-50"
        >
          {loading ? "Checking the receipts…" : "Verify"}
        </button>
      </div>

      {error && <p className="mt-6 text-rose-400">{error}</p>}

      {result && (
        <section className="mt-8 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">@{result.handle}</h2>
            <span className="text-sm text-zinc-400">
              trust {Math.round(result.trustScore * 100)}% · {result.elapsedMs}ms
            </span>
          </div>
          <p className="text-sm text-zinc-400">{result.summary}</p>
          {result.cards.map((card) => (
            <article
              key={card.skill}
              className={`rounded-xl border p-4 ${VERDICT_STYLE[card.verdict]}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-100">{card.skill}</h3>
                <span className="text-xs font-semibold">{VERDICT_LABEL[card.verdict]}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{card.reason}</p>
              {card.citedArtifacts.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {card.citedArtifacts.map((a) => (
                    <li key={a.url}>
                      <a href={a.url} target="_blank" rel="noreferrer" className="underline">
                        {a.title ?? a.url}
                      </a>
                      {a.detail ? <span className="text-zinc-500"> — {a.detail}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
