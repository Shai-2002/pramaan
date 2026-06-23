# Pramaan — 5 Mandatory Diagrams (Mermaid)

## 1. User Journey / Workflow

> A recruiter pastes one handle + claimed skills and gets back evidence-backed cards (Verified / Contradicted / Unverified) instead of trusting the candidate's own resume text.

```mermaid
flowchart TD
    A([Recruiter opens candidate in Redrob]) --> B[Pastes GitHub handle + claimed skills<br/>e.g. React 4 yrs, Node 3 yrs]
    B --> C[/POST /api/verify/]
    C --> D{{Pramaan agent runs<br/>per-skill verification loop}}
    D --> E[Gathers real artifacts:<br/>commits, live URLs, published writing]
    E --> F[Renders Evidence Cards<br/>side by side]
    F --> G[VERIFIED<br/>cites real commits + live deploy]
    F --> H[CONTRADICTED<br/>timeline does not reconcile = honeypot]
    F --> I[UNVERIFIED<br/>no artifacts = keyword-stuffer]
    G --> J[Recruiter reads plain-language reason<br/>+ clicks through to cited artifacts]
    H --> J
    I --> J
    J --> K([Recruiter trusts the screen,<br/>not the self-written resume])

    classDef good fill:#d6f5d6,stroke:#2e7d32,color:#1b5e20
    classDef bad fill:#fde0e0,stroke:#c62828,color:#7f1d1d
    classDef warn fill:#fff3cd,stroke:#f9a825,color:#7a5900
    class G good
    class H bad
    class I warn
```

## 2. AI Logic & Decision Flow

> The per-skill agent loop RESOLVE->FETCH->RECONCILE->ATTRIBUTE->EMIT: it reasons only over retrieved evidence, returns UNVERIFIED unless it can cite an in-window authored artifact, and kills honeypots when the timeline refuses to reconcile.

```mermaid
flowchart TD
    Start([Claimed skills + GitHub handle]) --> Pick{More skills<br/>to verify?}
    Pick -- No --> Done([Return all Evidence Cards])
    Pick -- Yes --> Skill[Take next claimed skill<br/>e.g. 'React, 4 yrs']

    Skill --> Resolve[RESOLVE<br/>find candidate's real artifacts:<br/>GitHub handle, deployed URLs, blog]
    Resolve --> Fetch[FETCH<br/>commit metadata + diffs via GitHub API,<br/>URL liveness via Playwright,<br/>writing via Jina Reader]

    Fetch --> Gate{Any real evidence<br/>retrieved?}
    Gate -- No artifacts --> Unver[EMIT verdict = UNVERIFIED<br/>no cited artifacts<br/>keyword-stuffer]
    Unver --> Pick

    Gate -- Evidence found --> Reconcile[RECONCILE<br/>LLM reasons over RETRIEVED EVIDENCE only,<br/>never the profile text:<br/>does the claim hold in the claimed window?]
    Reconcile --> Attribute[ATTRIBUTE<br/>forked-vs-authored,<br/>AI-generated-code FLAG never auto-reject,<br/>timeline reconciliation]

    Attribute --> Timeline{Does the artifact timeline<br/>reconcile with the claimed window?}
    Timeline -- No: dates impossible<br/>account younger than claim --> Contra[EMIT verdict = CONTRADICTED<br/>honeypot kill-shot<br/>cite the conflicting dates]
    Timeline -- Yes --> CiteGate{Can we cite at least<br/>one authored artifact<br/>in-window?}
    CiteGate -- No citation --> Unver
    CiteGate -- Yes --> Verified[EMIT verdict = VERIFIED<br/>confidence + cited_artifacts<br/>+ plain_language_reason]

    Contra --> Pick
    Verified --> Pick

    classDef good fill:#d6f5d6,stroke:#2e7d32,color:#1b5e20
    classDef bad fill:#fde0e0,stroke:#c62828,color:#7f1d1d
    classDef warn fill:#fff3cd,stroke:#f9a825,color:#7a5900
    class Verified good
    class Contra bad
    class Unver warn
```

## 3. System Architecture

> A thin Next.js app on Vercel: the UI calls /api/verify, an AI-SDK orchestrator runs the agent loop, and tools (GitHub API, Jina, Playwright, Exa, OpenRouter) supply evidence and reasoning, returning Evidence Cards as JSON.

```mermaid
flowchart LR
    subgraph Client[Browser]
        UI[Next.js UI<br/>paste handle + skills,<br/>render Evidence Cards]
    end

    subgraph Vercel[Vercel - Next.js app]
        API[/api/verify route/]
        Orch[Agent Orchestrator<br/>Vercel AI SDK<br/>per-skill loop + tool calls]
    end

    subgraph Tools[Evidence + Inference Tools]
        GH[GitHub API<br/>commits, diffs, authorship, dates]
        Jina[Jina Reader<br/>published writing -> clean text]
        PW[Playwright<br/>deployed-URL liveness check]
        Exa[Exa<br/>discover blogs / artifacts]
        LLM[OpenRouter LLM<br/>RECONCILE + ATTRIBUTE reasoning]
    end

    UI -->|paste handle + claims| API
    API --> Orch
    Orch -->|RESOLVE / discover| Exa
    Orch -->|FETCH commits| GH
    Orch -->|FETCH writing| Jina
    Orch -->|FETCH liveness| PW
    Orch -->|RECONCILE over evidence| LLM
    LLM -->|verdict + confidence| Orch
    Orch -->|Evidence Cards JSON| API
    API -->|cards: verified/contradicted/unverified| UI
```

## 4. Data / Context / Intelligence Layer

> The intelligence layer is an evidence graph (claim -> artifacts -> verdict): each skill resolves to real artifacts, those produce a cited verdict + confidence, and the result becomes a trust feature the Resume Ranker consumes rather than a competing score.

```mermaid
flowchart TD
    subgraph Claims[Claim layer - from profile, NOT scored as text]
        C1[Claim: React, 4 yrs]
        C2[Claim: Node, 3 yrs]
    end

    subgraph Artifacts[Evidence layer - the candidate's real work]
        A1[Authored commits<br/>+ diffs + timestamps]
        A2[Live deployed URL<br/>liveness + ownership]
        A3[Published writing<br/>blog / docs]
        A4[Repo signals<br/>forked vs authored,<br/>AI-gen flag]
    end

    subgraph Verdicts[Verdict layer - Evidence Card]
        V1[verdict + confidence<br/>cited_artifacts]
        V2[plain_language_reason]
    end

    C1 -->|RESOLVE points claim at evidence| A1
    C1 --> A2
    C2 --> A1
    C2 --> A3
    A1 --> A4

    A1 -->|in-window? authored?| V1
    A2 --> V1
    A3 --> V1
    A4 --> V1
    V1 --> V2

    V1 -->|trust feature per skill| Trust[(Trust Layer<br/>skill -> verdict + confidence + citations)]
    Trust -->|consumed as a feature, not a ranking| Ranker[[Redrob Resume Ranker]]

    classDef store fill:#e3f0ff,stroke:#1565c0,color:#0d3c78
    class Trust store
```

## 5. Redrob Ecosystem Integration

> Pramaan plugs into Redrob as a trust layer beside the Resume Ranker and People Search via one clean verify API, issuing Verified-skill badges whose network effect (more verified candidates -> more recruiter trust -> more verification) compounds the moat.

```mermaid
flowchart LR
    subgraph Candidate[Candidate-facing]
        Profile[Candidate profile<br/>self-authored claims]
    end

    subgraph Redrob[Redrob platform]
        Ranker[[Resume Ranker<br/>scores fit]]
        Search[[People Search]]
        Badge{{Verified-skill badge}}
    end

    subgraph Pramaan[Pramaan - Trust Layer]
        API[/Clean API contract:\nPOST verify {handle, claims}\n-> Evidence Cards[]/]
        Engine[Provenance engine<br/>agent loop + evidence graph]
    end

    Profile -->|handle + claims| API
    API --> Engine
    Engine -->|Evidence Cards:<br/>verified / contradicted / unverified| API

    API -->|trust signal per skill| Ranker
    API -->|filter by verified skills| Search
    API -->|verified -> issue badge| Badge

    Badge -->|badge shown on profile| Profile
    Badge -.->|more verified candidates<br/>=> recruiters trust the badge<br/>=> more candidates verify| Profile

    Ranker -->|better-trusted shortlist| Outcome([Hiring decision])

    classDef pramaan fill:#ede7f6,stroke:#5e35b1,color:#311b92
    class API,Engine pramaan
```

