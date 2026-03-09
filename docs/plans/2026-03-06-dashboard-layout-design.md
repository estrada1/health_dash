# Dashboard Layout Design

## Goal
Create a more intentional, consistent dashboard-style UI across Tracker, Journal, and Diet while keeping each page focused on its specific task flow.

## Constraints
- Keep existing routes and API behavior unchanged.
- Preserve current page-level scope:
  - Tracker includes weight + workouts.
  - Journal includes journal entry creation + history.
  - Diet includes meal logging + history.
- Keep responsive behavior strong on desktop and mobile.

## Chosen Direction
Single-column section cards on each page with a shared structure:
1. Summary card
2. Add card
3. History card

This keeps visual consistency and adds dashboard structure without over-scoping into major IA changes.

## Information Architecture

### Shared Page Shell
- Keep top nav across pages.
- Standardize top spacing and page title presentation.
- Introduce reusable card pattern (`section-card`) with consistent:
  - internal spacing
  - heading styles
  - border, radius, and shadow
  - section-to-section rhythm

### Tracker
- Summary card:
  - latest weight
  - weekly weight delta
  - workouts this week
- Add card:
  - weight entry form
  - workout form as a separate subsection
- History card:
  - weight chart
  - workout calendar
  - workout timeline

### Journal
- Summary card:
  - total entries
  - last entry date
- Add card:
  - markdown textarea
  - helper hint
  - submit
- History card:
  - recent entries list

### Diet
- Summary card:
  - meals today
  - calories today
  - 7-day average calories
- Add card:
  - meal form
- History card:
  - meal entries grouped as currently rendered by existing JS logic

## Component/Style System
- Add common utility classes for:
  - card containers
  - card headers
  - metric grid/tiles
  - section dividers/subsection headers
- Use same button style across pages and same mobile behavior.
- Keep typography and color palette aligned to existing theme, but strengthen hierarchy with card framing and metric emphasis.

## Data Flow
- No API changes required.
- Existing frontend fetch/render flow remains.
- Add-only DOM containers for summary metrics; frontend computes summaries from data already fetched for each page.

## Error/Empty Handling
- Show explicit empty states in summary/history cards:
  - "No entries yet" style blocks with helper text.
- Maintain current form error/success behavior and placement directly under forms.

## Responsiveness
- Desktop:
  - centered content container
  - stacked cards with stable max width and clear vertical rhythm
- Mobile:
  - reduced card padding
  - full-width primary buttons
  - metric tiles collapse to 1-2 columns depending on width

## Testing/Validation Plan
- Manual visual verification on:
  - `/`
  - `/journal`
  - `/diet`
  - desktop and iPhone viewport
- Functional smoke checks:
  - submit weight
  - submit workout
  - submit journal entry
  - submit meal
- Confirm nav and existing API flows remain intact.

## Non-Goals
- No new routes.
- No backend data model changes.
- No major interaction redesign (e.g., side rail, drag/drop, complex filtering).
