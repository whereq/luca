# Publishing to npm — step-by-step

This document walks through the **one-time setup** required to publish
`@luca-game/engine` and `@luca-game/platform` to the public npm
registry. After setup, releases are a one-line git tag.

## One-time setup (do this ONCE)

### 1. Create an npm account

If you don't have one:
- Go to https://www.npmjs.com/signup
- Create an account with the email you want associated with the package

### 2. Create the `luca-game` org

To publish under the `@luca-game/` scope, you need an npm org:
- Go to https://www.npmjs.com/org/create
- Name: `luca-game`
- Choose the **free** plan (Unlimited public packages)
- Confirm the org is created

After creating, the org needs at least one maintainer (your account).

### 3. Create an npm access token

For the GitHub Actions workflow to publish, it needs a token:
- Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
- Click "Generate New Token" → "Automation" (NOT "Publish")
- Copy the token — you won't see it again

**Why Automation and not Publish?** Automation tokens work with 2FA
and don't require interactive login. Publish tokens are for local CLI
use.

### 4. Add the token to GitHub

- Go to https://github.com/whereq/luca/settings/secrets/actions
- Click "New repository secret"
- Name: `NPM_TOKEN`
- Value: paste the token from step 3
- Click "Add secret"

The token stays in GitHub's secrets — never in the repo, never in
the workflow YAML.

### 5. Verify the setup (dry run)

The publish workflow has a `workflow_dispatch` trigger that supports
a dry_run mode:
- Go to https://github.com/whereq/luca/actions/workflows/publish.yml
- Click "Run workflow" → select `main` branch → set dry_run=true
- Watch the logs; it should build and pass through publish with
  `--dry-run` (no actual publish)

If the dry run passes, you're ready for the real release.

## Releasing a new version

Each package has its own version. The tag encodes both:

```
luca-v<engine-version>-<platform-version>
```

Examples:
- `luca-v0.1.0-0.1.0` — both at 0.1.0
- `luca-v0.1.1-0.1.0` — engine 0.1.1, platform 0.1.0
- `luca-v0.1.0-0.1.1` — engine 0.1.0, platform 0.1.1

### Procedure

```bash
# 1. Bump versions (if needed). npm version updates package.json + creates a commit.
cd packages/engine
npm version 0.1.1  # or 0.2.0, or 1.0.0 — whatever the change warrants

cd ../platform
npm version 0.1.1  # or whatever

cd ../..

# 2. Push the version-bump commits
git push origin main

# 3. Tag and push
git tag luca-v0.1.1-0.1.1
git push origin luca-v0.1.1-0.1.1
```

The workflow:
1. Verifies tag versions match package.json
2. Installs deps, builds both packages
3. Runs tests
4. `npm publish --provenance` for each package
5. Creates a GitHub release with auto-generated notes

### Versioning rules (semver)

- **Patch** (0.1.0 → 0.1.1): backwards-compatible bug fixes
- **Minor** (0.1.0 → 0.2.0): backwards-compatible new features
- **Major** (0.1.0 → 1.0.0): breaking changes

We're pre-1.0 so the rules are looser — anything 0.x.y means "API may
change". Hit 1.0.0 when you commit to API stability.

## Verifying a publish

```bash
# After the workflow completes, verify the package is on npm
npm view @luca-game/engine
npm view @luca-game/platform

# Install in a test project
mkdir /tmp/luca-test && cd /tmp/luca-test
npm init -y
npm install @luca-game/platform
node -e "import('@luca-game/platform').then(m => console.log(Object.keys(m)))"
# Should print: ['Gallery', 'PlayPage', 'GameCard', 'ComingSoon', 'Faq', ...]
```

## Troubleshooting

### "You do not have permission to publish"

The `luca-game` org exists but your account isn't a maintainer:
- Go to https://www.npmjs.com/org/luca-game/members
- Add your account as a maintainer

### "ENEEDAUTH" error in workflow

The `NPM_TOKEN` secret isn't set or is invalid:
- Re-create the token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
- Update the GitHub secret
- Re-run the workflow

### Version mismatch between tag and package.json

The workflow validates this and fails fast. Update the tag to match
what's in package.json (or vice versa) and re-push.

### A package version already exists

npm doesn't let you re-publish the same version. To "unpublish":
```bash
npm unpublish @luca-game/engine@0.1.0 --force
```

**This is destructive** — it breaks anyone who installed that version.
Only do it within 72 hours of the original publish. After that,
publish a new version (e.g. 0.1.1 with a fix).

## After the first publish

Update `catobigato.com` to consume from npm instead of the
`file:./vendor/` workaround:

```json
// frontend/package.json
{
  "dependencies": {
    "@luca-game/platform": "^0.1.0"  // was: "file:./vendor/luca-game-platform-0.1.0.tgz"
  }
}
```

Then:
- Delete `frontend/vendor/`
- Remove the `bundle-platform.mjs` invocation from any deploy scripts
- The Dockerfile can revert to the two-step COPY pattern (faster
  Docker builds via layer caching)
- You can switch back to yarn (if you want) — the nested-`file:`-dep
  issue is gone now that both packages come from npm

That's a separate catobigato release (v1.0.0.124 or wherever the
counter is) — it doesn't need to happen on the same day as the
first npm publish.