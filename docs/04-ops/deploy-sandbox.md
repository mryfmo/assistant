# Preconditions

- Contracts validated (G1 pass).
- Required local services available.
- `openwrk` installed and available on PATH.
- Docker Desktop running (or Apple `container` CLI available).
- Workspace path exists and is readable.

# Steps

```bash
export ORCH_ENV=sandbox
export WORKSPACE_PATH="$(pwd)"

# 1) Start host services in sandbox mode
openwrk start --sandbox auto --workspace "$WORKSPACE_PATH" --approval auto --detach

# 2) Verify OpenWork/OpenCode health
openwrk status --openwork-url "http://127.0.0.1:8787" --opencode-url "http://127.0.0.1:4096"

# 3) Run smoke checks (health + events)
openwrk start --sandbox auto --workspace "$WORKSPACE_PATH" --check --check-events

# 4) Run static checks in the current repo
bun run lint:biome
bun run typecheck:ts

# 5) Optional checks (only if Python/Rust components exist)
# uv run --project tooling/optional/python ruff format --check components
# uv run --project tooling/optional/python ruff check components
# uv run --project tooling/optional/python ty check components
# cargo check --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features
```

# Verification

- Health endpoint returns ready.
- Sample workflow completes with dry-run artifacts.
- Event stream includes planning, clarification (if triggered), dispatch, and execution results.

# Expected Outputs

- `openwrk status` returns healthy for both OpenWork and OpenCode endpoints.
- Static checks exit with status code 0.
- Sandbox execution produces artifact references and correlated `workflow_id` logs.
