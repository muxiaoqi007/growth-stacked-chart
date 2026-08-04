const { existsSync, mkdirSync, copyFileSync } = require("fs");
const { resolve, join, relative } = require("path");

// The schema must match the apiVersion declared in pbiviz.json.
const pbiviz = require("../pbiviz.json");
const apiVersion = `v${pbiviz.apiVersion}`;
const source = resolve(__dirname, "..", "node_modules", "powerbi-visuals-api", "schema.capabilities.json");
const targetDir = resolve(__dirname, "..", ".api", apiVersion);
const target = join(targetDir, "schema.capabilities.json");

if (!existsSync(source)) {
  throw new Error(`Missing Power BI capabilities schema: ${source}`);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
console.log(`Prepared Power BI API schema: ${relative(process.cwd(), target)}`);
