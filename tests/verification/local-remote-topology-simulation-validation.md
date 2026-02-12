# local-remote-topology-simulation-validation

- Requirement: `ORCH-INT-4001`
- Objective: prove Plan Agent x1 and Task Execution Agents xN constraints hold in local and remote pseudo-execution.

## Procedure

1. Run `bun run check:g6-topology`.
2. Execute local topology simulation with one plan agent and multiple execution agents.
3. Execute remote topology simulation with one plan agent and multiple remote execution agents.

## Pass Criteria

- Both local and remote topology simulations succeed.
- Dispatch events include required workflow/task/request correlation fields.
