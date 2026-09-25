const fs = require('fs');
const cp = require('child_process');
const path = require('path');

function check(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.')) {
      check(full);
    } else if (item.isFile() && item.name.endsWith('.js')) {
      try {
        cp.execSync(`node -c "${full}"`);
        console.log('✓ OK:', full);
      } catch (err) {
        console.error('✗ ERROR in', full, err.message);
        process.exit(1);
      }
    }
  }
}

console.log('Checking api/ directory...');
check('api');
console.log('Checking js/ directory...');
check('js');
console.log('Checking prisma/ directory...');
check('prisma');
console.log('Checking scripts/ directory...');
check('scripts');
console.log('ALL FILES PASSED SYNTAX CHECK!');
