// 扫描 examples 下的示例目录,生成入口页 examples/index.html
// 用法:node scripts/gen-examples-index.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = path.join(root, "packages/vue/examples");

const names = fs
  .readdirSync(examplesDir, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      fs.existsSync(path.join(examplesDir, entry.name, "index.html"))
  )
  .map((entry) => entry.name)
  .sort();

const links = names
  .map((name) => `      <li><a href="./${name}/">${name}</a></li>`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ass-vue examples</title>
  </head>
  <body>
    <h1>ass-vue examples</h1>
    <ul>
${links}
    </ul>
  </body>
</html>
`;

fs.writeFileSync(path.join(examplesDir, "index.html"), html);
console.log(`Generated index.html with ${names.length} examples`);
