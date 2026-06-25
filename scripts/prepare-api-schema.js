const fs = require("fs");
const path = require("path");

const apiVersion = "v5.9.0";
const source = path.resolve(__dirname, "..", "node_modules", "powerbi-visuals-api", "schema.capabilities.json");
const targetDir = path.resolve(__dirname, "..", ".api", apiVersion);
const target = path.join(targetDir, "schema.capabilities.json");

if (!fs.existsSync(source)) {
  throw new Error(`Missing Power BI capabilities schema: ${source}`);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Prepared Power BI API schema: ${path.relative(process.cwd(), target)}`);
