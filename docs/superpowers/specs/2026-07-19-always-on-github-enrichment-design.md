# Always-On GitHub Enrichment Design

## Goal

GitHub enrichment runs automatically for every resume score. Users do not configure or disable the enrichment step.

## Behavior

Every scoring run extracts the resume's basic profile links before scoring. When a GitHub profile is present, the browser fetches the public GitHub profile and repository summary and includes that evidence in the scoring and coaching context.

If the resume has no GitHub profile, the pipeline proceeds without GitHub data. If GitHub is unavailable, rate-limited, or returns invalid data, the pipeline degrades gracefully and continues scoring the resume without enrichment.

A GitHub token remains optional. When present, it is sent only to GitHub and raises the API rate limit. The absence of a token does not disable enrichment.

## Settings And Storage

Remove the `enableGitHub` setting from frontend settings types, persistence, providers, and pipeline dependencies. Existing `ha-enable-github` browser values are ignored and removed when settings are next persisted or browser data is cleared.

The Settings screen remains focused on the Gemini key and model because there is no GitHub enable/disable control in the approved Paper layout.

## User Feedback

All score runs show the extraction stage. The GitHub enrichment stage is included in the progress sequence and is reached when a profile is available.

Privacy and documentation copy must describe GitHub enrichment as automatic when a GitHub profile is found, rather than optional or conditionally enabled.

## Testing

Tests must demonstrate that:

- Scoring always performs profile extraction.
- A detected GitHub profile triggers enrichment without an enable flag.
- Missing profiles skip the GitHub request but still score successfully.
- GitHub failures do not block scoring.
- Settings no longer read, persist, or pass an enrichment toggle.

