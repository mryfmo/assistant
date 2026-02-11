# plan-agent-no-side-effects-test

- Requirement: `ORCH-CORE-0002`
- Objective: prove Plan Agent does not execute side effects.

## Procedure

1. Submit an intent that would cause side effects if executed.
2. Run planning stage only.
3. Inspect emitted actions and task queue contents.

## Pass Criteria

- No execution task with side-effect capability is dispatched during plan stage.
- No external write/send/delete event occurs before approval and execute stages.
