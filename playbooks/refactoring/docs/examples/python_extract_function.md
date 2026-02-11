# Example: Python Function Extraction

## Goal

Extract duplicated normalization logic into one helper without changing behavior.

## Before

- The same normalization block appears in multiple functions.

## After

- Introduce one pure helper and replace duplicated call sites.

## Verification

```bash
uv run --project tooling/optional/python ruff format --check components
uv run --project tooling/optional/python ruff check components
uv run --project tooling/optional/python ty check components
```

## Reviewer Notes

- No behavior change expected.
- Exceptions and return shape preserved.
