## 0.6.4

- Model RequirePlatformPermissionUnderClassGuard as policy enforcement only, including composed wrappers.
- Preserve class authentication and access declarations without crediting an extra authentication guard; report a missing authenticating guard when only AccessPolicyGuard remains.

## 0.6.3

- Analyze caller-input filters, identity use, permission gates, API prefixes, and emulation entry points as TypeScript syntax.
- Require audit identifier evidence, follow reachable helpers without a fixed depth limit, and support declared durable audit models.
- Respect Git ignores and configured fragment-select suffixes.
- Fail on missing guard-baseline operations and support operation-scoped baseline updates.
- Document reasoned resolver-scope and structured-audit declarations.
