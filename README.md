# Atreyus CutSheet Demo

Hey, if you're reading this — you're probably someone at Atreyus. This is my attempt at not just sending a resume into the void.

I'm a senior studying CS. I saw the internship posting two days ago. You've probably gotten a hundred applications since then. I'd be sad if mine got lost in the pile, but not *super* sad — that's just the game. What I *can* control is showing you that I actually build things instead of just talking about them.

So here's a small project I put together specifically for this application.

---

## What this actually is

**The one-line version:** You describe a deck you want to build in plain English, and the app spits out a complete lumber order with waste-optimized cuts and a cost estimate.

**The finance-bro version:** Imagine a contractor types *"Build me a 10×12 deck with 4×4 posts and joists 16 inches apart."* Right now that contractor either manually calculates what lumber to buy (slow, error-prone), or they guess and over-order (expensive waste). This tool takes that plain-English description and in about 10 seconds gives back: here's every board you need to cut, here's how to cut them to minimize scrap, here's what it's going to cost you at Home Depot.

**The technical version, kept short:** It's a 3-stage pipeline:

1. **Claude reads the scope** — AI parses the plain-English description into structured cut requirements (sizes, quantities, lumber types)
2. **The browser does the math** — A bin-packing algorithm (First Fit Decreasing) figures out how to fit all those cuts onto standard stock boards with minimum waste
3. **Claude writes the estimate** — AI turns the extraction + optimization output into an estimator-ready summary: cost lines, labor notes, and a "double-check these" list

Each stage stays visible on screen independently. If stage 3 fails, you still see stages 1 and 2. If stage 1 fails, you see a clean error right there — no black box.

---

## Why this, why now

Atreyus works in construction estimation. I didn't want to build a generic CRUD app and slap your name on it. I spent a few hours thinking about what a small but *real* tool in this space would look like — something that a project manager or estimator might actually open.

The idea isn't groundbreaking. I know that. A real version of this would need live supplier pricing, local building codes, permit logic, and a lot more. What I'm trying to show is the *thinking behind it*, not the idea itself:

- I thought about the actual user (the estimator/contractor), not just the tech
- I built it in a way where each stage is independently useful — if the AI fails, the data you already got doesn't disappear
- I kept the UI simple enough that a non-technical person can use it without reading a manual
- I shipped it in a weekend instead of spending three weeks designing the perfect architecture

---

## What it looks like

You get a text box. You type (or load) a deck scope. You hit **Run staged flow**. You watch three stages complete in sequence with live status badges. You get a table of cuts, an optimized board layout with waste percentages, and a cost summary — all in one screen, no page reloads.

---

## Running it locally

You'll need an Anthropic API key.

```bash
git clone https://github.com/aatif101/atreyus-cutsheet-demo
cd atreyus-cutsheet-demo
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Hit "Load sample scope" then "Run staged flow."

---

## Stack

- **Next.js 15** + React 19 + TypeScript
- **Tailwind CSS v4**
- **Anthropic SDK** (Claude for extraction + summarization)
- **Vitest** for unit tests on the optimizer and schema validation

---

## Honest notes

The lumber prices are hardcoded fixtures — this is a demo, not a live pricing engine. The AI extraction is only trained on pressure-treated framing right now. The optimization algorithm handles the happy path well; exotic cuts get flagged for manual review.

This took a weekend. It's not production-ready. But it runs, it's tested, and every stage does what it says it does.

---

If it's useful context: I'm happy to walk through any part of the code, talk through what I'd build next, or just have a conversation about how Atreyus actually approaches estimation workflows. That'd honestly be more interesting to me than a standard interview round.

— Aatif
