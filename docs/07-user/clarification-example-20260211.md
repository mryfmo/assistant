# Clarification Example

## User Intent

"Create a skill that checks CRM updates and emails finance every morning."

## Clarification 1

- Question: Which CRM account should be used?
- Reason: Prevent updates from the wrong tenant.
- Options: [Production CRM, Staging CRM, Specify account]
- Recommended default: Staging CRM
- Consequence: Limits impact during validation.

## Clarification 2

- Question: Should the workflow send real emails in sandbox?
- Reason: Prevent accidental external communication.
- Options: [No, mock email only; Yes, send real emails]
- Recommended default: No, mock email only
- Consequence: Keeps sandbox side effects safe.

## Clarification 3

- Question: Who must approve production promotion?
- Reason: Enforce accountability for high-risk execution.
- Options: [Requester only; Requester + Admin]
- Recommended default: Requester + Admin
- Consequence: Adds dual-control for production changes.
