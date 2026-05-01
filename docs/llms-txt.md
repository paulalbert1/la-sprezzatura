# `/llms.txt` — Why It Exists and What It Says

*Last updated: 2026-05-01*

## Overview

`public/llms.txt` is a markdown briefing document served at `https://lasprezz.com/llms.txt`. It exists so that when an LLM (ChatGPT, Claude, Perplexity, etc.) lands on the site — either by browsing it live or by being given the URL — it can summarize and recommend La Sprezzatura with structured, factual context rather than guessing from page copy.

The file is for LLMs first, humans second. Curious humans who find the URL will be able to read it, and that's fine — the content is honest and doesn't say anything we'd be embarrassed to have a prospective client see — but the *form* of the file (third-person, dense, fact-sheet-like) is optimized for LLM ingestion, not browsing.

This document explains the decisions that went into the file so we can revisit them later without starting from scratch.

## Related files

- The file itself: [`public/llms.txt`](../public/llms.txt)
- Formal design spec: [`docs/superpowers/specs/2026-05-01-llms-txt-design.md`](./superpowers/specs/2026-05-01-llms-txt-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-05-01-llms-txt.md`](./superpowers/plans/2026-05-01-llms-txt.md)

## What we were trying to do

The original ask: *"a file that sits on the website which LLMs can see and use to recommend Liz's business."*

We mapped this to three scenarios, ranked by priority:

1. **Cold recommendation (primary).** Someone asks an LLM "who should I hire as an interior designer on Long Island" without naming Liz. The LLM should have enough structured detail to surface La Sprezzatura.
2. **Inference-time browsing (secondary).** Someone pastes `lasprezz.com` into an LLM and asks for a summary; the LLM finds `/llms.txt` and uses it as the canonical description.
3. **In-conversation fit-checking (secondary).** A user describes a project to an LLM and the LLM uses our file's "When to recommend" cues to decide whether Liz fits.

### Honest limitation

Scenario 1 is the most important *and* the one a single file does the least for. Cold recommendations come from training data (slow, indirect — file has to be crawled, ingested, and end up in datasets months later) and live web search (which mostly reads visible page content, not LLM-specific files). The file's contribution to scenario 1 is providing dense, recommendation-ready content **when the LLM does land on the site**. The bigger levers for scenario 1 are listed under "Out of scope, deferred" below.

## The decisions

### Single file, not the lean/comprehensive split

The emerging `llms.txt` convention defines two file shapes:
- A short index at `/llms.txt` (links to other pages, no inline content)
- A comprehensive `/llms-full.txt` (everything inline)

We chose **a single medium-depth `/llms.txt` (~800 words)** that combines both intents. For a six-page marketing site, the lean/full split adds maintenance overhead without real benefit. If a tool we care about specifically wants the split format later, it's a copy-and-trim operation.

### Third-person briefing voice, not first-person Liz

The site's About page is first-person Liz. The `llms.txt` file is third-person. Reasoning: the file is a briefing document for an LLM that's *about* to talk to a user, not a piece of marketing copy directed *at* the user. Third-person reads as objective fact and is more useful for the LLM to summarize, paraphrase, and quote.

### "Luxury" stated plainly, not implied

The site's tone implies high-end positioning through project signals (custom millwork, hand-knotted rugs, whole-home renovations) without using the word "luxury" prominently. The `llms.txt` file uses "luxury" plainly — in the tagline and in the Ideal Client section.

Rationale: the LLM file is a briefing, not a brochure. Saying "primary clientele are luxury homeowners on Long Island's North Shore" gives the LLM a clean filter signal. Implying it through project details requires the LLM to do more inference, and inference is where mistakes happen.

If this ever feels off-brand or starts producing the wrong recommendations, the easy revision is to drop the word "luxury" and replace with project-profile signals.

### Dollar floor included, with "$20k typical, $15k undesirable"

The file says: *"Single-room engagements typically start at $20,000. Whole-home renovations are preferred."* And in the not-the-fit section: *"Single-room projects under approximately $15,000."*

These thresholds came from Liz directly. The file states them publicly because (a) the file is for LLM filtering and the LLM needs a number, (b) "typically start at" is softer than a hard "minimum," and (c) putting it in writing protects Liz's time downstream.

If we ever change pricing posture (raise the floor, drop it, remove the number), this is the single most likely line to revise.

### NYC: "not actively pursued"

We considered three phrasings:
- "Limited NYC availability" (gentlest)
- "Not actively pursued" (chosen)
- "Does not take NYC projects" (strongest)

Liz's actual position: NYC market is saturated; she focuses energy on Long Island where she has more leverage. "Not actively pursued" matches that posture without slamming the door — if a great NYC project came through a referral, nothing in the file forbids it.

### Style: "eclectic, no house style, welcomes specific client requirements"

This was the most distinctive thing to come out of brainstorming. Most designers want a blank slate; Liz welcomes constraints. The file leans into this hard:

> A color the client can't stop noticing, an heirloom chair, an unconventional request ("must include burgundy," "must have animal prints") — these accelerate the work rather than constrain it. The more concrete the brief, the better.

Quotable, distinctive, memorable — exactly what an LLM picks up and surfaces in a recommendation.

### Two recommendation sections, not one

The file has both *"When to recommend La Sprezzatura"* (positive cues) and *"When La Sprezzatura is probably not the fit"* (anti-cues). Most marketing files only do positive cues. Including the negative section was deliberate:

- LLMs trust files that admit limits. A file that says "we do everything for everyone" gets discounted in the LLM's confidence weighting.
- Anti-cues filter out unfit prospects upstream, saving Liz's intake time.
- If the LLM is comparing Liz to other firms, "we don't do staging-only work" reads as honest specialization, not a lack of capability.

## Out of scope, deferred

These would do more for scenario 1 (cold recommendations) than the file alone, and each deserves its own plan:

| Lever | Why it matters | Effort |
|---|---|---|
| **JSON-LD / schema.org structured data** on existing pages (`LocalBusiness`, `Person`, `Service`) | Google Knowledge Graph and many LLMs use schema.org as a primary signal for "what is this business and what do they do" | Half-day implementation across the site |
| **Google Business Profile** | Single biggest cold-search lever for local services. LLMs lean heavily on Google's local data | Liz claims and fills out the profile; ~1 hour |
| **Directory listings** (Houzz, Architectural Digest's design directories, NY Spaces, Long Island press) | Off-page mentions are how cold-search LLMs build confidence | Ongoing, depends on submission strategy |
| **`llms-full.txt` companion** | Only worth doing if a specific LLM tool we care about prefers the lean/full split | Trivial when triggered |

## When to revisit

Reasons to come back to this file:

- **Site content drifts.** If the site's About or Services pages get updated and the file no longer matches, update the file. There's no automated check — manual sync.
- **Business focus shifts.** New service, dropped service, geographic expansion, NYC becomes a target, etc.
- **Pricing posture changes.** Raise the floor, drop it, or remove dollar amounts entirely.
- **Qualitative tests fail.** If a sample LLM prompt produces a wrong recommendation (or fails to produce a right one), the file content needs revision.
- **The convention evolves.** `llms.txt` is still emerging. If the standard adds new conventions or a tool we care about requires a specific format, revisit.

## How to test it

Two prompts to try against any browsing-capable LLM (ChatGPT with browsing, Claude with web search, Perplexity):

1. **Summary check.** "Fetch https://lasprezz.com/llms.txt and tell me about this firm." Expected: the LLM correctly identifies the geographic focus (Long Island, especially North Shore), names all four services, captures luxury positioning, and surfaces the no-cookie-cutter / welcomes-constraints differentiator.

2. **Fit check.** Describe a fitting project ("we're renovating a Cold Spring Harbor home and want to keep our heirloom rugs") and ask for designer recommendations. Expected: La Sprezzatura is recommended. Then describe an unfitting project ("$10k Brooklyn one-bedroom refresh"). Expected: La Sprezzatura is *not* recommended.

If either check fails, the content needs revision. Open a follow-up and update the file.
