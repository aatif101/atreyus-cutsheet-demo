# Atreyus CutSheet Demo

Hey, if you're reading this, you're probably someone at Atreyus. This is my attempt at not just sending a resume into the void.

I'm a senior studying CS. I saw the internship posting two days ago. You've probably gotten a hundred applications since then. I'd be sad if mine got lost in the pile, but not super sad — that's just the game. What I can control is showing you that I actually build things instead of just talking about them.

So here's a small project I put together specifically for this application.

---

## What it does

**The one-line version:** You describe a deck you want to build in plain English, and the app spits out a complete lumber order with waste-optimized cuts and a cost estimate.

Quick honesty before I go further — I'm not a construction person. I had to look most of this up. So in case this README gets passed to someone non-technical, and in case I get a word slightly wrong: *lumber* is just the wooden boards you build with — the 2x4s and 2x6s stacked up at any hardware store. A *cut sheet* (which I noticed is also the name of one of your product surfaces) is the list a builder actually works from: every piece of wood the job needs, the exact length to cut each one, and how many. Getting that list right is the difference between one trip to the store and three.

**The contractor's version:** Imagine a contractor types *"Build me a 10×12 deck with 4×4 posts and joists 16 inches apart."* Right now that contractor either manually calculates what lumber to buy (slow, error-prone) or guesses and over-orders (expensive waste). This tool takes that plain-English description and, in about 10 seconds, gives back: here's every board you need to cut, here's how to cut them to minimize scrap, and here's what it'll cost you at Home Depot.

---

## What I'm actually showing you

I want to be straight about this: **this is not a finished product. It's an idea, built in a weekend.** I don't think the idea itself is groundbreaking, and a real version would need a lot more than I have here — live supplier pricing, building codes, regional labor rates, and frankly your actual data and domain knowledge.

What I'm trying to show isn't the idea. It's how I think about turning a messy real-world problem into a small, shippable feature.

I built this on purpose as something that could be **a feature or an agent skill inside a bigger platform** — not a standalone app. The pipeline below is the kind of thing that could slot into a product surface like CutSheet, or get wired up as a reusable skill in a Workflows-style agent builder. I don't know what your CutSheet actually does — I built this blind. The point isn't "I rebuilt your product." The point is "this is how I'd approach building inside it, and I'd love to see the real thing."

---

## How it works

The technical version, kept short — it's a 3-stage pipeline:

1. **Claude reads the scope** — AI parses the plain-English description into structured cut requirements (sizes, quantities, lumber types).
2. **The browser does the math** — A bin-packing algorithm (First Fit Decreasing) figures out how to fit all those cuts onto standard stock boards with minimum waste.
3. **Claude writes the estimate** — AI turns the extraction + optimization output into an estimator-ready summary: cost lines, labor notes, and a "double-check these" list.

Each stage stays visible on screen independently. If stage 3 fails, you still see stages 1 and 2. If stage 1 fails, you get a clean error right there — no black box. That part matters to me: an agent feature that hides its own failures is worse than no feature.

Again — this is an idea, not a finished product. The value is in the shape of it, not the polish.

---

## Where this could go

If this were real, the directions I'd push it:

- **Plug into software contractors already use.** The plain-English-to-cut-list step doesn't have to be its own screen. It could be an agent skill that feeds an estimating tool, a takeoff app, or whatever system a contractor already runs all day — the AI does the messy translation, the existing software does what it's good at.
- **Real pricing.** Swap the hardcoded demo prices for live supplier feeds, and the output stops being an estimate and starts being a quote.
- **Beyond decks.** The same extract → optimize → summarize pattern works for framing, fencing, railing — anything that's linear material cut to length. The pipeline doesn't care that it's a deck; that's just what I scoped the demo to.
- **As a reusable pattern, not one feature.** Extraction → optimization → summary is a *shape*. Inside a platform, that shape could be a skill other workflows call on demand, not a single hardcoded flow.

That last one is really the pitch. I didn't build a deck app. I built one small, honest example of a pattern I think shows up all over a platform like yours.

---

## Running it locally

You'll need an Anthropic API key.

```bash
git clone https://github.com/aatif101/atreyus-cutsheet-demo
cd atreyus-cutsheet-demo
npm install
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), hit "Load sample," then "Run staged flow."

---

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, the Anthropic SDK, and Vitest for the optimizer and schema-validation tests.

---

## The honest closing

This took a weekend. It's a demo — and I know your posting literally says "not demos, not toys." Fair. I built a demo because I don't have access to your stack; what I'm hoping comes through is the thinking, not the artifact.

Here's the real thing I want to say: if I had a proper look at what Atreyus actually does — the real CutSheet, the real data, the real constraints — I think I could come up with sharper solutions than this and own them end to end. I'd also genuinely want to be close to the people using this stuff, not just the code. That's the whole pitch: give me the real problem and I'll go further than a weekend demo.

— Aatif
