# Troubleshooting

## Memory Tool Not Available

- Confirm `opencode-mem` exists in plugin configuration.
- Verify with `opencode plugins list`.
- Check for conflicting duplicate config files.

## Memory UI Unreachable

- Check `webServerHost`/`webServerPort`.
- Verify local firewall policy.

## Context Saturation Persists

- Enable dynamic context pruning.
- Split large tool outputs into smaller operations.
- Persist durable information into memory instead of keeping large logs in active context.

## Weak Resume Quality After Compaction

- Run memory bootstrap at resume start.
- Strengthen compaction injection template if handoff lacks detail.

## Secret Leakage Concerns

- Add explicit pre-write checks before `memory.add`.
- Use `env://` or `file://` for credentials.
