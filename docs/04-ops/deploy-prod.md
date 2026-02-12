# Preconditions

- staging passed all gates and acceptance criteria.
- change approval recorded.

# Steps

1. Promote `staging -> prod` only after required approval and runtime gates pass.
2. Monitor SLO and error rates.
3. Trigger mandatory rollback when error rate exceeds 0.1% for 5 minutes.

# Verification

- Contract errors remain at zero.
- SLOs remain within defined thresholds.
