# UX 3.0: Survival Stickiness

## Problem Diagnosis
The UX 2.0 sprint successfully stripped away the raw admin-database feel, but the interface remained too pale, too polite, and lacked visual impact. It did not immediately trigger the product dopamine necessary for a casual visitor to bookmark the site or explore further. The text still felt generic ("Analysis reveals...") rather than urgent and operational ("Your account can look normal until...").

## Psychology Principles Added
- **Visceral Contrast:** Moving away from standard UI borders towards heavy, brutalist-inspired borders (`border-2 border-slate-900`, `shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]`) to signify importance and permanence.
- **The Uncomfortable Truth:** We stopped trying to politely summarize policies. We now open playbooks with a bold, aggressive truth about what happens when risk thresholds are met.
- **Urgent Action Priority:** Renaming components from mild suggestions ("This matters most if you...") to direct confrontations ("Are you exposed?").
- **Dopamine Loop:** Mimicking Netflix's discovery mechanics at the end of every playbook ("Check another platform before you depend on it") instead of just listing "Related Guides."

## Page Framework Updates
### Homepage (`/`)
- Now directly addresses the core user pain point with the headline "Survival guides for platform risk."
- Provides massive, high-contrast entry points: "Browse published guides" and "Start with Payments".
- Introduces a "Latest Survival Guides" grid immediately after the hero to pull users directly into content without scrolling past marketing text.

### Directory (`/platforms`)
- Completely overhauled from a generic list to a premium discovery surface.
- Cards use heavy hover states (transform up, deep shadow) and clearly advertise "Start survival guide".
- Explicitly states the product mission: translating confusing legal terms into actionable playbooks.

### Platform Playbook (`/platforms/[slug]`)
- **Huge Typography:** Titles pushed to `text-5xl` and `text-7xl`.
- **Survival Priority Block:** The "If you only do one thing" callout is now a massive, impossible-to-miss red alert box.
- **Story Risk Cards:** Replaced dry "Detailed Risk Profiles" with narrative-driven "Top Things That Can Go Wrong" cards containing specific "What can happen", "Operational Consequence", and "Prepare now" pillars.
- **Playbook Cards:** The before/during/after sections are no longer just text columns; they are heavy cards with massive distinct icons (`Compass`, `Activity`, `Shield`).

### Red Flag Playbook (`/red-flags/[id]`)
- Emphasizes "Why Users Get Caught" (The Trap).
- Heavy use of colored indicator dots (Amber for triggers, Red for impact) to make scanning effortless.
- Re-uses the massive Playbook and Actions components from the platform page to maintain consistency.

## Copy & Sanitizer Rules
The `PublicCopySanitizer` (`copy-sanitizer.ts`) was aggressively upgraded.
**Newly Blocked Phrases:**
- "being reviewed by the PoliBrawl editorial team"
- "official survival overview"
- "editorial team"

**Context-Aware Fallbacks:**
Instead of returning a single generic string, the sanitizer now returns highly specific, urgent text based on where it is called:
- `hero`: "Understand the operational risks, preparation steps, and official policy evidence before depending on this platform."
- `summary`: "This policy area may affect account access, payout timing, or operational continuity. Review the official evidence and prepare backup options before problems occur."
- `action`: "Ensure your operations comply with the platform's standard requirements to avoid disruption."

## Visual Hierarchy Rules
- **No thin lines:** Primary delineators use `border-2`.
- **No pale text:** Body text was bumped from `text-slate-500` to `text-slate-600` or `text-slate-700` with `font-medium`.
- **Shadows:** Avoided soft, fuzzy shadows in favor of sharp, distinct offset shadows for interactive elements to mimic physical playbooks or cheat sheets.

## Before/After Summary
- **Before (UX 2.0):** Clean, standard SaaS documentation. Polite, readable, but forgettable.
- **After (UX 3.0):** Aggressive, authoritative survival guides. High contrast, massive typography, explicit warnings, and a relentless focus on immediate action.

## Future Improvements
- Interactive "Exposure Checklist" that physically crosses out safe items or highlights danger items upon clicking.
- Direct links from "What To Do Today" cards out to the respective platform's admin dashboard (e.g., link directly to PayPal's export page).
- User accounts to save/bookmark specific platforms to a personal dashboard.
