# Tuning Guide

## `oh-my-opencode` Context Controls

- Enable dynamic context pruning for long sessions.
- Add `memory` to protected tools to avoid pruning high-signal memory outputs.
- Set recent turn protection to 3-5 turns.

## `opencode-mem` Retrieval Quality

Tune based on project noise level:

- `similarityThreshold`
- `maxMemories`
- `deduplicationSimilarityThreshold`

Suggested starting range:

- similarityThreshold: 0.60-0.70
- maxMemories: 10-20

## Compaction Policy

- Keep compaction focused on short-term continuation state.
- Keep durable reusable knowledge in memory entries.
