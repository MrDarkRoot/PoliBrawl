# PoliBrawl UX Knowledge Framework

## 1. Philosophy & Design System

PoliBrawl is a **Policy Survival Knowledge Base**. It is not an admin dashboard, a blog, or a news site. It is a professional, actionable, and neutral resource.

**Core Principles:**
- **Evidence-first but user-centric:** While everything is backed by evidence, users should first see actionable insights, summaries, and survival strategies before drilling down into raw evidence.
- **Modern Documentation Aesthetic:** The UI should feel like a premium documentation site (e.g., Stripe Docs, Linear Docs). Clean, minimal colors, ample whitespace, strong typography, and a sticky navigation sidebar for long pages.
- **Predictable Structure:** Every platform page and every red flag page follows a strict, predictable hierarchy. No surprises.

**Visual Language:**
- **Colors:** Minimalist palette. Neutral grays for text and backgrounds. Risk levels denoted by subtle but distinct colors (e.g., amber for medium risk, crimson for high risk).
- **Typography:** Modern sans-serif (Inter or similar). Clear hierarchy (H1, H2, H3).
- **Layout:** Max reading width of ~70 characters for paragraphs. Sidebar navigation on desktop. Cards for grouping related information.

## 2. Information Architecture (IA)

### Platform Page IA
1. **Hero Section:** Platform name, category, risk level, official website link, last reviewed date, and a one-sentence summary.
2. **TL;DR:** 3-5 concise bullet points summarizing the most critical takeaways.
3. **Top Risks:** Actionable cards highlighting the highest severity risks first.
4. **Who is Affected:** Visual chips categorizing affected user types (e.g., Freelancer, SaaS).
5. **Survival Checklist:** Actionable checklist for mitigating risks.
6. **Backup Options:** Alternative providers with tradeoffs.
7. **Detailed Red Flags:** Expandable cards for deeper context.
8. **Evidence:** Collapsed by default. Contains the official excerpt, source link, and review date.
9. **Editorial Methodology:** Disclaimer on independence and methodology.

### Red Flag Page IA
1. **Hero Section:** Red flag title, category, and severity.
2. **Summary:** Brief overview of the issue.
3. **Why it matters:** The operational impact on users.
4. **Who is affected:** Target user profiles.
5. **Typical Scenarios:** Real-world examples (if applicable).
6. **How to Survive (Survival Notes):** Core strategy.
7. **Checklist:** Specific mitigation steps.
8. **Alternative Options:** Backup providers.
9. **Evidence:** Collapsed official policy excerpt and link.
10. **Editorial Disclaimer:** Independence note.

## 3. Wireframes

### Homepage
```
[Header: Logo + Search + Nav]
------------------------------------------------
[Hero: "Understand Platform Risk Before It Happens." + Search Bar]
------------------------------------------------
[Featured Platforms Grid]
  [Card: Stripe - Payment - High Risk]
  [Card: PayPal - Payment - High Risk]
------------------------------------------------
[Recent Red Flags List]
------------------------------------------------
[Footer: Methodology & Links]
```

### Platform Page
```
[Header]
------------------------------------------------
[Sidebar Nav] | [Main Content Area]
              | 
[Sticky]      | # Platform Name
- TL;DR       | Category Badge | Risk Badge | Official Website
- Risks       | One sentence summary.
- Checklist   |
- Backups     | ## TL;DR
- Details     | • Point 1
- Methodology | • Point 2
              |
              | ## Top Risks
              | [Risk Card 1] [Risk Card 2]
              |
              | ## Who is Affected?
              | [Freelancer] [SaaS] [Creator]
              |
              | ## Survival Checklist
              | [x] Action 1
              | [ ] Action 2
              |
              | ## Backup Options
              | [Backup Card]
              |
              | ## Detailed Red Flags
              | [Expandable Red Flag Card]
              |   -> Inside: Summary, Survival Note, Collapsed Evidence
              |
              | ## Editorial Methodology
              | Disclaimer text.
```

### Red Flag Page
```
[Header]
------------------------------------------------
[Sidebar Nav] | [Main Content Area]
              | 
[Sticky]      | # Red Flag Title
- Summary     | Platform Link | Category Badge | Risk Badge
- Impact      | 
- Survival    | ## Summary
- Checklist   | Text summary...
- Options     | 
- Evidence    | ## Why it matters
              | Text impact...
              |
              | ## Who is affected
              | [Chips]
              |
              | ## How to survive
              | Strategy text...
              |
              | ## Checklist
              | [x] Step 1
              |
              | ## Alternative Options
              | [Backup Card]
              |
              | ## Evidence (Collapsed)
              | > "Official excerpt..." [Source Link]
              |
              | ## Editorial Disclaimer
              | Disclaimer text.
```

## 4. Design Decisions

- **Evidence Last:** By placing evidence at the bottom (or inside collapsed sections), we prioritize actionable advice. Users want to know *what to do* first, and *proof* second.
- **Card-based UI:** Cards chunk information logically, making it easier to scan.
- **TL;DR and Checklists:** These cater to users in a hurry or in a crisis who need immediate, actionable steps rather than prose.
- **Sidebar Navigation:** Essential for long documentation-style pages, allowing quick jumps to specific sections (e.g., straight to the Checklist).
- **Server Components:** We will implement this predominantly with React Server Components to ensure fast page loads, SEO optimization, and zero unnecessary client-side JavaScript. Client components will only be used for interactive elements like collapsed states or sticky scrolling observers.
