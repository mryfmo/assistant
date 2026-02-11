# Rules

- Use normative words only: MUST, MUST NOT, SHOULD, MAY.
- Avoid fuzzy words: TBD, maybe, later, etc., and so on.
- Every cross-boundary interaction MUST have a typed contract.
- Every requirement MUST map to at least one validation gate.
- Every timeout and limit MUST be numeric with units.
- Every risk-sensitive action MUST have explicit approval semantics.

# Prohibited Phrases

- "Do as needed"
- "Handle appropriately"
- "Support future cases"
- "Implementation detail"

# Required Traceability

Every requirement entry MUST define:

- ID
- statement
- rationale
- contracts
- validation gate
- verification artifact

# Review Enforcement

Pull requests MUST be rejected if ambiguity or missing traceability is detected.
