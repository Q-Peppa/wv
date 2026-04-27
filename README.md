# @peppa_q/wv — which-version

Query what version of a dependency a package requires from the npm registry.

## Install

```bash
npm install -g @peppa_q/wv
```

## Usage

```bash
# latest version
wv sass-loader webpack
# => {"webpack": "^5.0.0"}

# specific version
wv webpack@5 node
# => {"node": ">=10.13.0"}

# engines field
wv eslint node
# => {"node": "^20.19.0 || ^22.13.0 || >=24"}

# not found
wv sass-loader nonexistent
# => {}
```

The command checks `engines`, `dependencies`, `peerDependencies`, `devDependencies`, and `optionalDependencies` (in that order) and returns the first match.

## Registry

Requests are sent to `registry.npmmirror.com` first, with automatic fallback to `registry.npmjs.org`.
