# Rust Refactoring Notes

## Typical Risks

- Lifetime and ownership changes that alter behavior indirectly.
- Error enum restructuring without preserving semantic mapping.
- Hidden allocation/performance regression from convenience APIs.

## Guidance

- Keep public API behavior stable.
- Use typed errors and preserve variant meaning.
- Prefer explicit ownership transitions over clone-heavy shortcuts.

## Project Check Commands

```bash
cargo fmt --manifest-path <components/rust-*/Cargo.toml> --check
cargo clippy --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features -- -D warnings
cargo check --manifest-path <components/rust-*/Cargo.toml> --all-targets --all-features
```
