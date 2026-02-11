# 01_principles — Non-Negotiable Principles

## P1. Protect Observable Behavior

Never change behavior that users, systems, or operations rely on unless the change is explicitly scoped as a behavior change.

## P2. Minimize Diff Size

Keep each commit focused on one intent. Smaller diffs reduce cognitive load and improve review accuracy.

## P3. Keep Every Step Reversible

No irreversible migration in a refactor-only task. Always keep rollback options.

## P4. Separate Mechanical and Semantic Changes

Formatting/import sorting/renames should not be mixed with logic edits.

## P5. Evidence Over Confidence

Use checks and tests as proof. Avoid claims without reproducible command output.

## P6. Respect Existing Contracts

API schemas, error contracts, and integration interfaces are contract boundaries.

## P7. Preserve Operational Safety

Refactoring must not degrade observability, security controls, or incident handling.

## P8. Prefer Intentional Simplicity

Do not introduce abstractions "for future use" unless there is a concrete need.
