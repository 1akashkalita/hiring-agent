# Sample Run History Exclusion Design

## Goal

Scoring the bundled sample resume must display a complete results report without adding that run to the user's resume history.

## Storage Behavior

Normal uploaded-resume runs continue to save in IndexedDB and appear in History, trends, revision rails, and comparisons.

Sample runs are saved only in tab-scoped `sessionStorage`. The results route can load the sample run after navigation or refresh within the same tab, but history queries never return it. Closing the tab removes it automatically.

## Integration

The score flow identifies the sample at the call site rather than by filename. `handleFile` accepts an explicit persistence mode so a user-uploaded file named `sample-resume.pdf` is still treated as a normal saved run.

The shared run loader checks IndexedDB first and then tab-scoped sample storage. History listing continues to read only IndexedDB, which keeps samples out of trends, revisions, and comparisons without filtering each consumer separately.

Clearing all browser data also removes any tab-scoped sample runs.

## Failure Handling

If tab-scoped storage is unavailable, the score remains successful but the app reports the same result-loading failure used for a missing run after navigation. A storage failure must not cause a sample to be written into persistent history as a fallback.

## Testing

Tests must demonstrate that:

- A sample run can be loaded by ID from tab-scoped storage.
- Sample runs do not appear in the persistent run list.
- Clearing browser data removes tab-scoped sample runs.
- A normal uploaded resume continues to save in IndexedDB.

