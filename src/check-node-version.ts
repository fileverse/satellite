const minimum = 22;
const current = parseInt(process.versions.node, 10);

if (current < minimum) {
  console.error(
    `\x1b[31mNode.js v${minimum}+ is required (current: v${process.versions.node}). Please upgrade at https://nodejs.org\x1b[0m`,
  );
  process.exit(1);
}
