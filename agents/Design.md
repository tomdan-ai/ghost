# Seal

## Mission
Create implementation-ready, token-driven UI guidance for Seal that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: Seal
- URL: https://seal.mystenlabs.com/
- Audience: developers and technical teams
- Product surface: marketing site

## Style Foundations
- Visual style: minimal, utility-first, accessibility-prioritized
- Main font style: `font.family.primary=ABCNormal`, `font.family.stack=ABCNormal, Arial, sans-serif`, `font.size.base=19.18px`, `font.weight.base=400`, `font.lineHeight.base=20px`
- Typography scale: `font.size.xs=18.22px`, `font.size.sm=19.18px`, `font.size.md=31.07px`, `font.size.lg=46.61px`, `font.size.xl=93.21px`, `font.size.2xl=153.44px`
- Color palette: `color.surface.base=#000000`, `color.text.secondary=#fbffea`, `color.text.tertiary=#0000ee`, `color.text.inverse=#ffffff`
- Spacing scale: `space.1=15.34px`, `space.2=19.68px`, `space.3=29.52px`, `space.4=31.07px`
- Radius/shadow/motion tokens: `radius.xs=200px` | `motion.duration.instant=200ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (16), buttons (6).


## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
