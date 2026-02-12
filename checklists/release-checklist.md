# Release Checklist

- [ ] All CI gates are green on release commit.
- [ ] Executable gate logs for G0/G1/G5/G6/G7 are attached to release evidence.
- [ ] Staging validation completed.
- [ ] Promotion approval recorded.
- [ ] Canary-only rollout checks are only required when canary is active by policy.
- [ ] If canary is active, canary monitoring and rollback controls are verified.
- [ ] Rollback plan verified.

Canary rollout is out of scope for the current requirements set (`spec-pack`); treat this item as conditional only when an operationally active canary policy is enabled.
