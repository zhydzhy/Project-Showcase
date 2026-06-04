---
title: How I Use ERP to Guide My 定投
date: 2026-06-04
summary: A simple rule-based framework for adjusting monthly investments based on how expensive the market is.
---

## What is ERP and why does it matter?

**Equity Risk Premium (ERP)** is the extra return you expect from stocks over risk-free bonds. For the Chinese market, I compute it as:

> **ERP = HS300 Earnings Yield − ChinaBond 10Y Yield**

- **HS300 TTM P/E** tells us how much we're paying for one unit of earnings. When the P/E is low, earnings yield is high — stocks are cheap.
- **ChinaBond 10Y** is the risk-free baseline. If bonds pay 1.8% and stocks yield 7.5%, that 5.7% spread is your reward for taking equity risk.

A **wide spread** means stocks are cheap relative to bonds. A **narrow spread** means stocks are expensive — you're taking on risk without getting paid for it.

## The percentile-based rule

I maintain a historical ERP distribution (sampled periodically) and bucket the current reading into percentiles. Each percentile range maps to a fixed multiplier on my base monthly investment amount:

| Percentile | Status | Multiplier | What it means |
|---|---|---|---|
| ≥ 90th | Extremely cheap | **2.0x** | Rare opportunity — double down |
| 80–89th | Cheap | **1.5x** | Good value, lean in |
| 60–79th | Slightly cheap | **1.2x** | Modest opportunity |
| 40–59th | Normal | **1.0x** | Steady as she goes |
| 20–39th | Slightly expensive | **0.8x** | Ease off, but stay in |
| < 20th | Expensive | **0.5x** | Market is hot — save your powder |

## Why this works (psychologically and mechanically)

**It removes emotion.** When the market drops 20% and every headline screams panic, the math says "ERP is high → buy more." When A-shares rip 30% in a quarter and everyone's euphoric, the math says "ERP is compressed → scale back." You execute the plan, not the feeling.

**It forces you to buy low.** The multiplier is highest exactly when assets are cheapest. This is the single most important thing in investing, and it's the hardest to actually do.

**It keeps you in the game.** Even at 0.5x, you're still investing — because staying in the habit matters more than optimizing any single month.

## How the ERP value updates

The ERP reading on this site is pulled from `content/ERP.md`, which is regenerated server-side by a script that fetches:
- HS300 trailing-twelve-month P/E from an upstream data source
- ChinaBond 10-year yield

A cron job runs every 30 minutes to keep it current. The frontend reads the latest spread, calculates the historical percentile, and displays the suggested investment amount — no manual intervention needed.
