// Links this project folder into your Foundry Data/modules directory
// so Foundry can see it without you having to copy files on every change.
//
// Run with: npm run link
//
// On Windows this creates a directory "junction", which (unlike a symlink)
// does NOT require running as Administrator.

import fs from "node:fs";
import path from "node:path";

const MODULE_ID = "pass-the-initiative";

// Your Foundry userdata folder:
const FOUNDRY_DATA_PATH = "C:\\Users\\seewa\\AppData\\Local\\FoundryVTT\\Data";

const source = process.cwd();
const destDir = path.join(FOUNDRY_DATA_PATH, "modules");
const dest = path.join(destDir, MODULE_ID);

if (!fs.existsSync(destDir)) {
  console.error(`Could not find "${destDir}". Check FOUNDRY_DATA_PATH in this script.`);
  process.exit(1);
}

if (fs.existsSync(dest)) {
  console.log(`Link already exists at:\n  ${dest}`);
  process.exit(0);
}

try {
  // "junction" works on Windows without admin rights, as long as source
  // and destination are on the same drive.
  fs.symlinkSync(source, dest, "junction");
  console.log(`Linked module:\n  ${source}\n  -> ${dest}`);
} catch (err) {
  console.error("Failed to create the link.", err.message);
  console.error(
    "If this keeps failing, try running your terminal as Administrator, " +
      "or manually create the junction with:\n" +
      `  mklink /J "${dest}" "${source}"`
  );
  process.exit(1);
}
