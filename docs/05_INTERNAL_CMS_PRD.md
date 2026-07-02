# Internal CMS PRD

Epic B is an internal CMS for building and maintaining PoliBrawl survival pages. The CMS is for founder or admin use only.

## Product Goal

Make it fast for one operator to go from "new platform worth covering" to "published survival page with evidence-backed red flags" without building a heavyweight compliance system.

## CMS Modules

## Platform Registry

Purpose: create and manage the master list of covered platforms.

Admin actions:
- create platform
- edit platform metadata
- archive or unarchive platform
- open related sources, red flags, and checklist work

Fields displayed:
- name
- slug
- category
- short description
- website URL
- status
- last reviewed date

Validation rules:
- slug unique
- category required
- name required
- status constrained to MVP workflow values

Not in scope:
- public user edits
- enrichment from third-party APIs

## Source Registry

Purpose: manage internal source inputs per platform.

Admin actions:
- add source manually
- edit metadata
- mark source active or archived
- open fetch/import history

Fields displayed:
- platform
- source title
- source type
- canonical URL
- source status
- captured or reviewed timestamps

Validation rules:
- URL required for fetch-based sources
- pasted text requires title and platform
- duplicate URL warning for same platform

Not in scope:
- wide autonomous crawling
- authenticated scraping

## Fetch URL / Paste Text

Purpose: capture source text for review.

Admin actions:
- fetch a public URL
- paste source text manually
- retry capture
- store capture result

Fields displayed:
- URL
- fetch status
- final URL
- response metadata
- extracted text preview
- capture timestamp

Validation rules:
- only allow safe URL schemes
- max payload size
- plain text required for paste mode
- empty captures rejected

Not in scope:
- browser automation
- login-required sources

## Red Flag Keyword Scanner

Purpose: scan captured source text for likely red flag candidates.

Admin actions:
- run scanner on one source
- rerun scanner after source updates
- inspect matched keywords and excerpts

Fields displayed:
- matched category
- matched keywords
- excerpt
- source reference
- candidate status

Validation rules:
- scanner runs only on captured text
- candidates require source linkage
- duplicate candidate detection per source excerpt

Not in scope:
- AI auto-classification as publishing authority
- autonomous severity scoring

## Candidate Review Queue

Purpose: let admins accept, reject, or defer candidate red flags.

Admin actions:
- approve candidate into red flag draft
- reject candidate
- mark needs rewrite
- filter by platform and category

Fields displayed:
- platform
- source
- category
- excerpt
- matched terms
- reviewer note
- status

Validation rules:
- only pending candidates can be approved or rejected
- approval must preserve source trace

Not in scope:
- public queue exposure
- crowd voting on candidates

## Red Flag Editor

Purpose: create and refine the public red flag record.

Admin actions:
- edit title, level, summary, and why-it-matters copy
- attach or reorder evidence
- save draft

Fields displayed:
- platform
- title
- category
- level
- summary
- why it matters
- draft status
- reviewed date

Validation rules:
- title required
- category required
- level required
- reviewed date required before publish

Not in scope:
- auto-generated public posts
- public inline editing

## Evidence Builder

Purpose: attach reviewed evidence to each red flag.

Admin actions:
- select source
- add excerpt
- set source title and link
- reorder evidence
- remove bad evidence

Fields displayed:
- source title
- source URL
- excerpt
- reviewed date
- sort order

Validation rules:
- excerpt required
- source reference required
- evidence must stay short enough for public display

Not in scope:
- full document mirroring
- screenshot galleries as default evidence format

## Survival Note Editor

Purpose: add practical user guidance tied to red flags or page sections.

Admin actions:
- create note
- edit note
- prioritize note
- publish or unpublish note

Fields displayed:
- note title
- note body
- linked red flag
- priority
- status

Validation rules:
- practical guidance required
- no legal-advice phrasing
- dangerous wording flagged

Not in scope:
- chatbot advice
- user comments on notes

## Backup Option Editor

Purpose: manage fallback tools or paths users can consider.

Admin actions:
- add backup option
- edit tradeoffs
- order options
- publish or archive

Fields displayed:
- label
- option type
- summary
- tradeoffs
- optional link
- status

Validation rules:
- tradeoffs required
- no undisclosed sponsorship
- avoid definitive endorsement language

Not in scope:
- affiliate optimization engines
- dynamic marketplace listings

## Checklist Editor

Purpose: build platform-specific survival checklists.

Admin actions:
- create checklist
- add checklist items
- reorder items
- publish or unpublish checklist

Fields displayed:
- checklist title
- intro
- items
- item order
- status

Validation rules:
- checklist item text required
- item order must be stable
- published checklist must have at least one item

Not in scope:
- task syncing
- account-based personal checklist tracking

## Community Signal Intake

Purpose: review structured public submissions.

Admin actions:
- review request counts
- inspect experience submissions
- approve safe tip summaries
- queue corrections
- mark submissions rejected or private-only

Fields displayed:
- submission type
- platform
- category
- message summary
- moderation status
- timestamp

Validation rules:
- all community content starts pending
- sensitive or defamatory content cannot publish
- aggregate displays must exclude unsafe raw text

Not in scope:
- public comments
- public user profiles
- forum threads

## Publisher

Purpose: enforce final checks before a platform survival page goes live.

Admin actions:
- preview page
- run publish checklist
- publish or unpublish

Fields displayed:
- platform summary
- red flag count
- evidence coverage
- note coverage
- checklist coverage
- warnings

Validation rules:
- no red flag publish without evidence
- reviewed date required
- only safe aggregate community blocks allowed

Not in scope:
- public scheduled publishing calendar
- multistep enterprise approval chains
