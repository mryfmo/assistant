# Commands

## TypeScript

```bash
bun run lint:biome
bun run typecheck:ts
```

## Python (Optional)

```bash
uv run --project tooling/optional/python ruff format --check components
uv run --project tooling/optional/python ruff check components
uv run --project tooling/optional/python ty check components
```

## Rust (Optional)

```bash
for manifest in $(find components -name Cargo.toml); do
  cargo fmt --manifest-path "$manifest" --check
  cargo clippy --manifest-path "$manifest" --all-targets --all-features -- -D warnings
  cargo check --manifest-path "$manifest" --all-targets --all-features
done
```

## Proto

```bash
buf lint
```

# Failure Policy

Any non-zero exit is a hard failure.

Optional language checks become mandatory only when corresponding components are introduced.
