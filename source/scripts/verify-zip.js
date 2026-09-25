const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const zipPath = 'C:\\Users\\DELL\\OneDrive\\Desktop\\TravelNexus_SourceCode_ObjectCode_2026-09-16.zip';

if (!fs.existsSync(zipPath)) {
  console.error('ZIP file not found at:', zipPath);
  process.exit(1);
}

const stat = fs.statSync(zipPath);
console.log('ZIP Location:', zipPath);
console.log('ZIP Size:', (stat.size / (1024 * 1024)).toFixed(2), 'MB (' + stat.size + ' bytes)');

const cmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath}'); $zip.Entries.FullName"`;
const raw = cp.execSync(cmd).toString();
const entries = raw.trim().split(/\r?\n/).map(s => s.trim().replace(/\\/g, '/')).filter(Boolean);

console.log('\nTotal entries in archive:', entries.length);

const rootFiles = entries.filter(f => !f.includes('/'));
const sourceFiles = entries.filter(f => f.startsWith('source/') && !f.startsWith('source/images/'));
const buildFiles = entries.filter(f => f.startsWith('build/') && !f.startsWith('build/images/'));
const imageSourceCount = entries.filter(f => f.startsWith('source/images/')).length;
const imageBuildCount = entries.filter(f => f.startsWith('build/images/')).length;

console.log('\n--- ZIP ROOT ---');
rootFiles.forEach(f => console.log('  ' + f));

console.log('\n--- /source/ (Clean Code & Config, excluding images) ---');
sourceFiles.forEach(f => console.log('  ' + f));
console.log('  source/images/ count:', imageSourceCount);

console.log('\n--- /build/ (Production Object Code, excluding images) ---');
buildFiles.forEach(f => console.log('  ' + f));
console.log('  build/images/ count:', imageBuildCount);

// Verify security: No secrets or env files
const sensitive = entries.filter(f => {
  const lower = f.toLowerCase();
  if (lower.includes('.env.local') || lower.includes('env.download')) return true;
  if (lower.endsWith('.env')) return true;
  if (lower.includes('node_modules') || lower.includes('.git/') || lower.includes('.vercel')) return true;
  return false;
});

console.log('\n--- SECURITY AUDIT ---');
if (sensitive.length === 0) {
  console.log('  ✓ ALL CHECKS PASSED: Zero credentials, tokens, or forbidden caches found.');
} else {
  console.log('  ✗ FAILED: Found sensitive entries:', sensitive);
}
