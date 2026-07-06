# UX 2.0: Survival Playbook Interface

## Product Psychology
PoliBrawl's public UI has been transitioned from a "database-readout" CMS style to an actionable, premium "Survival Playbook." This change leverages key psychological drivers:
1. **Threat Proximity:** Translating abstract legal text into direct business impacts (Cash Flow Freeze, Account Termination).
2. **Self-Identification:** Using explicit checklists ("This matters most if you...") so users immediately know if a risk applies to their operation.
3. **Action Relief:** Always providing immediate mitigating steps via the Survival Playbook ("Before," "During," "After").
4. **Progressive Disclosure:** Presenting an immediate TL;DR and top risks before diving into deeper evidence.
5. **Trust through Proof:** Relegating source text to an accordion, proving our claims without cluttering the main flow.
6. **Curiosity Loop:** Suggesting cross-comparisons with other platforms at the end of the guide.

## Page Frameworks
### Platform Page (`/platforms/[slug]`)
1. **Survival Hero:** Clear, definitive summary with a dominant "Survival Priority Callout."
2. **Risk Snapshot:** At-a-glance visualization of risk levels across categories (Cash Flow, Account Access, Verification, Recovery).
3. **Self-Identification:** Bulleted list clarifying who is in the blast radius of these policies.
4. **Top Risks:** Expanded cards detailing what happens, why it matters, and how to prepare.
5. **Survival Playbook:** Three-column layout advising actions for Before, During, and After a trigger event.
6. **Today's Actions:** Actionable hygiene checklists with priority and time estimates.
7. **Backup Rails:** Alternative platforms to mitigate dependency risk.
8. **How do we know?:** Collapsible section citing exact clauses and URLs.

### Red Flag Page (`/red-flags/[id]`)
1. **Uncomfortable Truth:** The hero explicitly states the hidden risk in plain English.
2. **Trigger Conditions & Operational Impact:** Clear definitions of what causes the event and what the user loses (funds, access, time).
3. **Deep Playbook:** Actionable defense strategies customized for this specific policy risk.

## Component Library
Located in `src/components/public/ui/playbook-components.tsx`:
- `SurvivalHero`
- `SurvivalPriorityCallout`
- `RiskMeter`
- `RiskSnapshotGrid`
- `SelfIdentificationChecklist`
- `TopRiskCard`
- `SurvivalPlaybook` / `PlaybookColumn`
- `TodaysActions` / `ActionItemCard`
- `BackupRails` / `BackupRailCard`
- `EvidenceAccordion`
- `RelatedGuides`
- `EditorialMethodology`
- `ReadingProgressNav`

## Copy Rules & Sanitization
A strict `PublicCopySanitizer` (`copy-sanitizer.ts`) guards against leaking internal artifacts to the public interface.
**Blocked Phrases include:**
- "minimum length", "constraint", "placeholder", "generated", "analysis reveals"
- "database", "candidate", "scanner", "research packet", "noise score", "confidence score"

If detected, text falls back to: *"This risk is being reviewed by the PoliBrawl editorial team."*

## Public Safety Rules
- No internal identifiers, UUIDs, or admin dashboard links are exposed.
- Visuals are strictly utilitarian—no excessive animations or gradients that distract from the core survival message.
- Content must remain neutral, factual, and strictly anchored to official sources without veering into legal advice.

## Before/After Summary
- **Before:** generic `RiskCard` arrays with dry summaries. Pages felt like read-only DB tables.
- **After:** Action-oriented playbooks structured logically by phase (prep, mitigate, recover) using high-contrast design cues to command attention.

## Future Improvements
- Interactive "Today's Actions" (persisting checked state via local storage).
- Advanced filtering and sorting in the `/platforms` directory.
- Deeper integration of specific platform API limits into the Risk Snapshot.
