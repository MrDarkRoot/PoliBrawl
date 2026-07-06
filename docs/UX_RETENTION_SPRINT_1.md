# UX Retention Sprint 1

## Retention Problem
The site effectively communicated risk but lacked strong retention loops. Users would land on a platform page, read it, and leave because there were no "hooks" dragging them into an exploration phase or showing the interconnectedness of their risk.

## Implemented Loops
1. **Stack Profiler (Homepage):** Users select the tools they rely on. The profiler tells them what their cumulative risk entails and points them directly to those playbooks.
2. **Platform DNA:** A visual breakdown of risk types (Money, Account, Verification, Recovery) with meter bars. This visualizes *why* a platform is risky at a glance.
3. **Related Guides Loop:** Replaced static "Next Guides" with a stronger call-to-action: "Check another platform before you depend on it", providing direct comparisons for substitute platforms.
4. **Risk Concept Links:** Added a Wikipedia-style "Related risk concepts" component linking users to concepts like "Funds hold" or "Reserve", simulating rabbit holes.
5. **Policy Freshness / Timeline:** Added a clear visual block explicitly stating when the guide was last reviewed against official terms, indicating that the guide is living documentation, not a static article.
6. **Shareable Warning Snippet:** Added a "Copy team warning" button on every red flag so users can easily share operational risks directly into their Slack channels.

## Psychology Behind Each Loop
- **Stack Profiler:** Uses the *Endowment Effect* and *Personalization*. By interacting with the site and declaring their stack, the user takes ownership of the results.
- **Platform DNA:** Uses *Cognitive Ease*. Abstract legal concepts are translated into 4 visual progress bars (e.g. Money Control: High).
- **Related Guides Loop:** Uses *Action Relief*. When we show a high risk, giving them an immediate alternative gives relief and keeps them reading.
- **Risk Concept Links:** Uses *Information Gap Theory*.
- **Policy Freshness:** Uses *Authority* and *Trust*.
- **Shareable Warnings:** Uses *Social Currency*. Giving them an easy copy-paste mechanism encourages them to look like the smart one in their company chat.

## What Was Intentionally Not Built
- **User Accounts / Profiles:** Too heavy for this sprint. Instead, the Stack Profiler uses purely local state.
- **Full Lexicon Pages:** Skipped for now. Risk concept links are placeholders for future search/filter queries.
- **Community Signals Feed:** Withheld. This must be tightly moderated and structured properly in a dedicated Community Sprint.

## Future Roadmap
- Policy diff viewer (visualizing exact textual changes over time)
- Stack watchlist (email alerts when a selected platform updates policies)
- Platform alerts feed
- Real knowledge graph visualizer
- Story/Community Layer (Wolf Notes and Contributor experiences)
