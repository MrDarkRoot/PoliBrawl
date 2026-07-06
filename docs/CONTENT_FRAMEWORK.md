# PoliBrawl Content Framework

## 1. Content Philosophy
The user does not want more legal text. They do not want to read a Terms of Service summary.
The user wants to know:
- What can go wrong?
- Does this affect me?
- What should I do today?
- How do we know this is real?
- What should I use as a backup?

## 2. Serious Editorial Voice
**Use:** Clear, calm, direct, practical, evidence-backed language. No fearmongering.
**Avoid:** Emotional accusations, "scam", "theft", "evil", "illegal" (unless directly citing a court/regulator). Avoid saying things "will happen" or are "guaranteed". Do not claim the "platform stole" money. Absolutely no meme language in core guides.

## 3. Platform Survival Guide Framework
Every Platform Guide (`/platforms/[slug]`) must use this exact psychological flow:

- **HOOK:** The Uncomfortable Truth (one strong sentence).
- **QUICK VERDICT:** Good for X, be careful if Y. Main survival priority.
- **ARE YOU EXPOSED?:** Self-identification checklist for the user.
- **RISK SNAPSHOT:** Visual meters covering Cash-flow risk, Account access risk, Verification burden, and Recovery friction.
- **TOP THINGS THAT CAN GO WRONG:** Story-based risk cards (The Trap, Operational Consequence, Prep).
- **SURVIVAL PLAYBOOK:** 3-phase strategy: Before anything happens, If it happens today, After recovery.
- **WHAT TO DO TODAY:** Concrete action checklist with priority and time estimates.
- **BACKUP RAILS:** Alternatives and their explicit tradeoffs.
- **HOW DO WE KNOW?:** Official evidence tucked in an accordion.
- **RELATED GUIDES:** Next platform discovery loop.
- **EDITORIAL METHODOLOGY:** Standard disclaimer on independence and evidence.

## 4. Red Flag Article Framework
Every Red Flag detail page (`/red-flags/[id]`) must follow this flow:

- **UNCOMFORTABLE TRUTH**
- **THE RISK** (Plain English)
- **WHY USERS GET CAUGHT** (The Trap)
- **ARE YOU EXPOSED?**
- **COMMON TRIGGERS**
- **WHAT BREAKS FIRST?** (Operational Impact)
- **SURVIVAL PLAYBOOK**
- **WHAT TO DO TODAY**
- **BACKUP PLAN**
- **HOW DO WE KNOW?**
- **OFFICIAL SOURCES**
- **DISCLAIMER**

## 5. Anti-Template Rules
Never render these phrases publicly (they imply a weak backend or AI generator):
- minimum length, constraint, placeholder, generated
- analysis reveals, summary needs
- critical control regarding, policy document as filler
- being reviewed by editorial team, official survival overview
- database, candidate, scanner, research packet, confidence score, noise score

*If the database contains these, the UI must sanitize them via `PublicCopySanitizer`.*

## 6. Content Variation Rules
Avoid making every platform sound the same. Each platform must focus on its specific operational angle:
- **PayPal:** cash-flow dependency, fund holds, account limitation.
- **Stripe:** verification, reserves, dispute/chargeback exposure, merchant risk.
- **Mercury:** business banking continuity, compliance review, account closure.
- **Brex:** corporate spend controls, cash management, reserve/payment restrictions.
- **Wise:** verification, transfer review, international payout friction.
- **Payoneer:** freelancer payout, withdrawal limits, KYC friction.
- **Vercel:** deployment continuity, billing, account/project access.
- **GitHub:** repository access, account suspension, data/workflow dependency.
- **OpenAI:** API access, usage policy, billing, model dependency.

## 7. Storytelling Formula
Even within serious guides, use this formula to explain a risk:
`Situation` → `What happens` → `Why users get caught` → `What breaks first` → `What to do today` → `Common mistakes` → `Backup plan` → `Official proof`

## 8. Copy Examples
- **Bad:** "Analysis of PayPal’s terms reveals critical control regarding money."
- **Better:** "Funds may become unavailable during review, reserve, or limitation periods."
- **Best:** "Your account can look normal until a review suddenly makes part of your balance unavailable."

## 9. Evidence Rules
- Evidence is mandatory for public red flags.
- Use short, highly relevant excerpts. Preserve source meaning. No long copyrighted blocks.
- Always link to the official source.
- Evidence supports claims; it does not replace practical explanation.

## 10. Publish Threshold
**Do not publish unless:**
1. At least one official evidence excerpt exists.
2. The summary is human-readable and direct.
3. A survival action exists.
4. A backup option exists.
5. A checklist exists.
6. There are no placeholder artifacts.
7. There are no hallucinated or unsupported claims.
