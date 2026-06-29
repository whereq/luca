# Distributing luca packages to consumers

## The current state (v0.1.0)

The luca packages (`@luca-game/engine`, `@luca-game/platform`) are
**not yet on npm**. Consumers wire them via local `file:` paths, like:

```json
{
  "dependencies": {
    "@luca-game/platform": "file:./vendor/luca-game-platform-0.1.0.tgz"
  }
}
```

## The file: resolution problem

When platform depends on engine by name (`@luca-game/engine`), and
both are installed via `file:` paths, **npm and yarn fail to resolve
the platform's engine dependency**. The error looks like:

```
error Couldn't find package "@luca-game/engine@0.1.0" required by
       "@luca-game/platform@file:./vendor/..." on the "npm" registry.
```

This happens because npm/yarn don't recursively unpack `file:` deps
from inside other `file:` deps.

## The fix: bundledDependencies

We work around this by **bundling the engine inside the platform
tarball** using npm's `bundledDependencies` feature. The result:

```
@luca-game/platform-0.1.0.tgz
└── package/
    ├── dist/                  ← platform code
    ├── package.json
    └── node_modules/
        └── @luca-game/engine/ ← bundled engine
            ├── dist/
            └── package.json
```

Consumers install platform, and engine is automatically available at
`node_modules/@luca-game/platform/node_modules/@luca-game/engine/`.

Node.js's module resolution walks up `node_modules` dirs, so the
platform's `import 'from '@luca-game/engine'` resolves correctly.

## Build script

`scripts/bundle-platform.mjs` automates this:

```bash
node scripts/bundle-platform.mjs /path/to/output/dir
```

Output: `luca-game-platform-0.1.0.tgz` (a self-contained tarball).

## Future: publish to npm (Phase 5)

When we publish to npm registry:

1. Consumers use semver: `"@luca-game/platform": "^0.1.0"`
2. The bundledDependencies workaround is no longer needed
3. The platform can keep its regular `dependencies: { @luca-game/engine: "^0.1.0" }`
4. We drop the bundle-platform script (or keep it as an offline install tool)

The npm-published workflow:

```bash
cd packages/engine && npm publish --access public
cd packages/platform && npm publish --access public
```

Done via GitHub Actions on tag push (see Phase 5 plan).