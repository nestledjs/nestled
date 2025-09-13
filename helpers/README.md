# @nestledjs/helpers - DEPRECATED

> ⚠️ **This package has been deprecated and is no longer maintained.**

## Migration Guide

The functionality from this package has been moved to other packages:

### DeepPartial Type
- **Previously:** `import { DeepPartial } from '@nestledjs/helpers'`
- **Now:** Available directly in `@nestledjs/forms` (if you're using the forms library)

### getPluralName Function
- **Previously:** `import { getPluralName } from '@nestledjs/helpers'`
- **Now:** `import { getPluralName } from '@nestledjs/utils'`

## For Forms Users
Simply update to the latest version of `@nestledjs/forms` (v0.4.17+) and remove the `@nestledjs/helpers` dependency:

```bash
npm uninstall @nestledjs/helpers
npm install @nestledjs/forms@latest
```

## For Generator Users
The `getPluralName` function is available in `@nestledjs/utils` which is already a dependency of the generator packages.

## Questions?
Please open an issue in the [main Nestled repository](https://github.com/nestledjs/nestled).
