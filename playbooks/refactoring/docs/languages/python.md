# Python Refactoring Notes

## Typical Risks

- Implicit runtime behavior hidden behind dynamic typing.
- Import side effects.
- Exception swallowing during utility extraction.

## Guidance

- Keep function signatures explicit.
- Preserve exception type and message semantics.
- Avoid broad `except Exception` blocks unless truly required.
- Keep modules import-safe.

## Project Check Commands

```bash
uv run --project tooling/optional/python ruff format --check components
uv run --project tooling/optional/python ruff check components
uv run --project tooling/optional/python ty check components
```

## Docstring Rule

Use Google-style docstrings for public modules/functions.
