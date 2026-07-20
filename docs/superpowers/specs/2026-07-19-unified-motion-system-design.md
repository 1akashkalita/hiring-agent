# Unified Motion System Design

## Goal

Use Framer Motion for every intentional spatial or visibility transition in the web app, including route changes, state swaps, menus, dialogs, progress, charts, and list entrances, while keeping the interface calm and easy to use.

## Motion Direction

The motion language is restrained and consistent. Route content crossfades while rising 8px. Groups use short 40-60ms staggers. Interactive surfaces move no more than 2px. Dialogs and menus use `AnimatePresence`. Active navigation and theme indicators use shared layout animation. Charts draw into place rather than appearing abruptly.

Color-only hover feedback remains CSS because it is not movement. Static transforms used solely for alignment are also allowed. All animated transforms, dimensions, opacity changes, and presence changes use Framer Motion.

## Architecture

- Hoist `AppShell` into the root layout so the header persists across routes.
- Add a keyed `RouteTransition` inside the shell for page enter/exit animation.
- Expand `web/src/ui/motion.tsx` as the single source for durations, easing, reveal, stagger, hover, and reduced-motion behavior.
- Use `AnimatePresence` for conditional UI such as loading/content swaps, model options, and saved/cleared status.
- Use motion SVG primitives for chart paths, areas, and points.
- Preserve the existing page layout, colors, copy, scoring behavior, and storage behavior.

## Accessibility

`useReducedMotion()` disables transforms, opacity ramps, path drawing, and stagger delays. Content remains immediately visible and interactive. Route animation does not move focus or change navigation semantics.

## Verification

- Browser test proves the shell persists across route navigation and each route has a motion wrapper.
- Browser test proves the custom model menu enters and exits through a motion presence boundary.
- Existing score, settings, privacy, history, and theme flows remain passing.
- TypeScript, unit tests, Playwright, and production build must pass.
