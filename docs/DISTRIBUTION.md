# Distribution

How to install the luca packages in a consumer project.

## Recommended: from npm (Phase 5+)

```bash
npm install @luca-game/platform
```

The packages are published to the public npm registry. No special
setup needed. See [PUBLISHING.md](./PUBLISHING.md) for how to
publish a new version.

## Legacy: vendored tarball (Phase 1-4)

Before npm publish, consumers (catobigato) installed via local
`file:./vendor/luca-game-platform-0.1.0.tgz` paths. The tarball
bundled the engine inside it via `bundledDependencies` so npm/yarn
could resolve the dependency chain.

**This workaround is no longer needed.** Use the npm install
command above. If you're maintaining an older consumer that still
uses the file: path, see git history for the bundle script.