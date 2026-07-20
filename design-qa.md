# Design QA

## Evidence

- Source visual truth: `/Users/aleksandrhubin/Downloads/Редизайн системы с улучшением типографики/ScopeBase Redesign.dc.html`
- Implementation screenshot: in-app Browser capture of `http://127.0.0.1:4173/`
- Desktop viewport: 1440 × 1024
- Mobile viewport: 390 × 844
- State: landing page, initial viewport

## Full-view comparison

The source and implementation were captured together at 1440 × 1024. The revised page now uses an inset presentation frame with a muted outer canvas, matching the source composition instead of extending the product surface edge to edge.

## Focused-region comparison

A separate crop was not needed because the affected outer frame, header, hero, first statistics row, typography, and borders were readable in the full-view comparison. Mobile was captured separately to confirm that the desktop frame does not narrow the 390 px layout.

## Required fidelity surfaces

- Fonts and typography: Public Sans and Space Grotesk remain aligned with the source, with unchanged hierarchy and wrapping.
- Spacing and layout rhythm: desktop uses responsive outer padding and a centered 1440 px maximum-width frame; mobile remains full width.
- Colors and visual tokens: the outer canvas uses the source's muted gray-green treatment; product colors are unchanged.
- Image quality and asset fidelity: the design contains no raster imagery requiring replacement.
- Copy and content: unchanged from the approved redesign.

## Findings

- No actionable P0, P1, or P2 findings remain.

## Comparison history

- Earlier P2: the landing surface extended to the browser edges, while the source used a clearly visible outer canvas.
- Fix: added responsive outer padding, a centered maximum-width frame, a subtle border, and restrained elevation.
- Post-fix evidence: the 1440 × 1024 capture shows the inset frame; the 390 × 844 capture reports `scrollWidth: 390` and preserves the mobile layout without horizontal overflow.

## Functional validation

- Production build: passed
- ESLint: passed
- Core client journey tests: 3 passed
- Primary landing CTA route: passed in the previous full redesign QA

## Follow-up polish

- None required for this change.

final result: passed
