# Example: Rust Error Handling Cleanup

## Goal

Consolidate repeated `map_err` branches into typed helper functions while preserving semantic error mapping.

## Before

- Error mapping logic duplicated at multiple call sites.

## After

- Shared typed helper used by all call sites.

## Verification

```bash
cargo fmt --manifest-path <components/rust-*/Cargo.toml> --check
cargo clippy --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features -- -D warnings
cargo check --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features
```

## Reviewer Notes

- Error codes and user-facing messages remain unchanged.
