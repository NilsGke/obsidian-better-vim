#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

function bumpVersion(version, type) {
    const [major, minor, patch] = version.split(".").map(Number);

    switch (type) {
        case "major":
            return `${major + 1}.0.0`;
        case "minor":
            return `${major}.${minor + 1}.0`;
        case "patch":
            return `${major}.${minor}.${patch + 1}`;
        default:
            throw new Error("Invalid version bump type");
    }
}

async function main() {
    const root = process.cwd();

    const packagePath = path.join(root, "package.json");
    const manifestPath = path.join(root, "manifest.json");
    const versionsPath = path.join(root, "versions.json");

    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    const currentVersion = pkg.version;

    console.log(`Current version: ${currentVersion}`);

    const type = await question("Release type (patch/minor/major): ");

    if (!["patch", "minor", "major"].includes(type)) {
        throw new Error("Invalid release type");
    }

    const targetVersion = bumpVersion(currentVersion, type);

    console.log(`New version: ${targetVersion}`);

    // 1. update package.json
    pkg.version = targetVersion;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

    // 2. update manifest.json
    manifest.version = targetVersion;
    const minAppVersion = manifest.minAppVersion;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // 3. update versions.json (your logic)
    const versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"));

    if (!Object.values(versions).includes(minAppVersion)) {
        versions[targetVersion] = minAppVersion;
        fs.writeFileSync(versionsPath, JSON.stringify(versions, null, "\t"));
    }

    console.log("Version updated successfully.");

    rl.close();
}

main().catch((err) => {
    console.error(err);
    rl.close();
    process.exit(1);
});
