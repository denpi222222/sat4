const fs = require('fs');
const path = require('path');

const isLocaleFile = filePath =>
  filePath.includes(path.join('lib', 'locales')) && filePath.endsWith('.json');

const walk = dir => {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
};

const RU_REGEX = /[а-яёА-ЯЁ]/;

const allFiles = walk(process.cwd());
const codeFiles = allFiles.filter(
  f =>
    !isLocaleFile(f) &&
    /\.(js|jsx|ts|tsx|md|html|css|cjs|mjs|json|yml|yaml)$/i.test(f)
);

let found = false;

for (const file of codeFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (RU_REGEX.test(line)) {
      found = true;
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
}

if (!found) {
  console.log('No Russian words found in code (excluding translations).');
} 