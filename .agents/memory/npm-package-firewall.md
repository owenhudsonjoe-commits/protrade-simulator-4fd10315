---
name: npm package firewall blocks
description: What to do when `npm install` fails with a 403 from package-firewall.replit.local due to a Socket Security Policy CVE block.
---

Replit's npm registry proxy can reject specific package versions with `403 Blocked by Security Policy` / "Critical CVE" even though the version resolves fine on the public registry. This is not a network or auth problem — retrying the same install will not help.

**Why:** the pinned version in package.json (or lockfile) has a known CVE that Replit's package firewall blocks outright.

**How to apply:** identify the blocked package/version from the npm error, check `npm view <pkg> versions --json` for newer patch releases, bump the semver range in package.json to a later patch/minor that isn't flagged, delete the lockfile if needed, and reinstall. Prefer the smallest version bump that resolves the block over disabling the policy or forcing the install.
