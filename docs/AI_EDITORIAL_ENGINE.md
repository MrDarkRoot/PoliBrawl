# AI Editorial Engine 1.0

## Architecture

The AI Editorial Engine sits directly between the automated Research Packets (which contain raw evidence, confidence scores, and raw metadata) and the final Published Guides. It serves as a deterministic "Draft & Prompt Builder."

Rather than calling AI APIs directly, this engine prepares a perfect, highly-structured writing brief (an "Editorial Draft") and a formatted LLM Prompt. These artifacts can then be passed to an external AI (like ChatGPT or Claude) by a Human Editor.

**Components:**
- `editorial-draft-builder.service.ts`: Deterministically compiles Research Packets, evidence, and platform metadata into structured `PlatformGuideDraft` and `RedFlagDraft` objects.
- `prompt-builder.service.ts`: Wraps the generated drafts in strict SYSTEM role instructions, constraints, and tone guidelines to ensure zero hallucinations and perfect formatting from external LLMs.
- `markdown-builder.service.ts`: Serializes drafts and prompts into clean, readable Markdown for easy copying/pasting.
- `style-guide.ts`: Centralizes the rules for tone, target audience, formatting, and forbidden words.
- `editorial-validator.ts`: A rigorous rule-engine that validates human-edited or AI-generated text against marketing language, missing citations, or emotional tone.

## Workflow & Draft Lifecycle

1. **Acquisition & Scanning:** The system acquires the terms and the scanner produces a Research Packet with approved Red Flag Candidates.
2. **Draft Generation:** The Admin clicks "Generate Editorial Draft". The engine extracts all approved candidates and evidence.
3. **Prompt Compilation:** The engine merges the draft with the `style-guide.ts` to produce a complete AI Prompt.
4. **External AI Writing (Out of Band):** The Admin copies the prompt, pastes it into an LLM, and gets a nearly-finished Markdown guide.
5. **Human Review (10-20%):** The Editor reviews the LLM's output, pasting it back into the CMS.
6. **Validation:** The `editorial-validator.ts` checks the text. If it passes, it's ready for publishing.

## Prompt Philosophy

The prompt is designed as a strict writing brief for a Senior Technical Editor. It enforces:
- **No hallucinations:** "Use ONLY the provided evidence."
- **Neutrality:** "Do not use fear-based, marketing, or emotional language."
- **Actionability:** "Focus on what the user must DO to survive."
- **Citations:** "Every risk must explicitly cite the provided source excerpt."

## Validation Rules

The `editorial-validator.ts` checks for:
- Missing sections (Executive Summary, Checklist, Evidence, Survival Strategy, Backup Options).
- Summary length (must be substantial but not bloated).
- Prohibited language (marketing fluff, emotional/fear-based words, explicit legal conclusions like "this is illegal").
- Unsupported claims.

## Future AI Integration Points

While V 1.0 relies on the Human Editor to copy/paste the prompt into an external LLM, the architecture is perfectly primed for V 2.0 (API Integration). The `prompt-builder.service.ts` output can be directly fed into the Vercel AI SDK or OpenAI API once the system is ready to automate the generation step.
