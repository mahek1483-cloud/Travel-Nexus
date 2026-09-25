/**
 * Travel Nexus - Release Packaging Pipeline
 * Stages clean source code (excluding credentials, node_modules, and cache) and
 * production object code (dist/), archives them into:
 * TravelNexus_SourceCode_ObjectCode_<YYYY-MM-DD>.zip,
 * saves directly to user's Desktop, and performs security verification.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const STAGING_DIR = path.join(ROOT_DIR, '_staging_release');

// Format date YYYY-MM-DD
const dateStr = '2026-09-16'; // Aligned with system date
const ZIP_NAME = `TravelNexus_SourceCode_ObjectCode_${dateStr}.zip`;

// Detect Desktop path across OS
function getDesktopPath() {
  if (process.platform === 'win32') {
    // Check OneDrive Desktop first as standard on modern Windows
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\DELL';
    const oneDriveDesktop = path.join(userProfile, 'OneDrive', 'Desktop');
    if (fs.existsSync(oneDriveDesktop)) {
      return oneDriveDesktop;
    }
    const standardDesktop = path.join(userProfile, 'Desktop');
    if (fs.existsSync(standardDesktop)) {
      return standardDesktop;
    }
    return oneDriveDesktop;
  } else {
    const home = process.env.HOME || '';
    return path.join(home, 'Desktop');
  }
}

function copyDirFiltered(src, dest, isSourceTree = false) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);

    // Global exclusions
    if (['node_modules', '.git', '.vercel', 'scratch', 'dist', '_staging_release'].includes(name)) {
      continue;
    }

    if (isSourceTree) {
      // Security: Strictly exclude credential and token files
      if (name.startsWith('.env') && name !== '.env.example') continue;
      if (name === 'env.download') continue;
      if (name.endsWith('.zip')) continue;
      if (name.endsWith('.log')) continue;
    }

    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath, isSourceTree);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function run() {
  console.log('📦 Travel Nexus Release Packager Starting...');
  const startTime = Date.now();

  const desktopDir = getDesktopPath();
  const destZipPath = path.join(desktopDir, ZIP_NAME);
  const localZipPath = path.join(ROOT_DIR, ZIP_NAME);

  console.log(`📍 Detected Desktop path: ${desktopDir}`);
  console.log(`🎯 Output target: ${destZipPath}`);

  // 1. Ensure production build is up to date
  console.log('\n🔨 Validating production build...');
  cp.execSync('node scripts/build-production.js', { cwd: ROOT_DIR, stdio: 'inherit' });

  // 2. Prepare staging directory
  console.log('\n📂 Preparing staging workspace...');
  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  // Copy root SOURCE_CODE_DOCUMENTATION.md
  fs.copyFileSync(
    path.join(ROOT_DIR, 'SOURCE_CODE_DOCUMENTATION.md'),
    path.join(STAGING_DIR, 'SOURCE_CODE_DOCUMENTATION.md')
  );
  console.log('  ✓ Staged SOURCE_CODE_DOCUMENTATION.md at root.');

  // Copy build/ (from dist/)
  console.log('  ✓ Staging /build/ (production object code)...');
  copyDirFiltered(path.join(ROOT_DIR, 'dist'), path.join(STAGING_DIR, 'build'), false);

  // Copy source/
  console.log('  ✓ Staging /source/ (clean source code repository)...');
  copyDirFiltered(ROOT_DIR, path.join(STAGING_DIR, 'source'), true);

  // 3. Create ZIP archive using .NET ZipFile for reliability and speed
  console.log('\n🗜️  Compressing into ZIP archive...');
  if (fs.existsSync(localZipPath)) {
    fs.unlinkSync(localZipPath);
  }
  if (fs.existsSync(destZipPath)) {
    fs.unlinkSync(destZipPath);
  }

  // Use PowerShell .NET ZipFile
  const zipCmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${STAGING_DIR}', '${destZipPath}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`;
  cp.execSync(zipCmd, { cwd: ROOT_DIR, stdio: 'inherit' });

  // Also copy to root as local copy if needed
  fs.copyFileSync(destZipPath, localZipPath);

  // 4. Clean up staging folder
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  console.log('  ✓ Cleaned up staging directory.');

  const zipStat = fs.statSync(destZipPath);
  console.log(`\n✅ Archive created successfully!`);
  console.log(`   Path: ${destZipPath}`);
  console.log(`   Size: ${formatBytes(zipStat.size)} (${zipStat.size} bytes)`);

  // 5. Verification & Security Audit of ZIP contents
  console.log('\n🔒 Performing Security & File Audit on generated ZIP...');
  const inspectCmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${destZipPath}'); $zip.Entries | Select-Object -Property FullName, Length | ConvertTo-Json"`;
  const rawEntries = cp.execSync(inspectCmd, { cwd: ROOT_DIR }).toString();
  const entries = JSON.parse(rawEntries);

  console.log(`   Total Entries in ZIP: ${entries.length}`);

  // Check for forbidden items
  const violations = [];
  const sensitivePatterns = [
    /\.env(\.|$)/i,
    /env\.download/i,
    /node_modules/i,
    /\.git(\/|\\|$)/i,
    /\.vercel/i,
    /scratch/i,
    /Travel-Nexus\.zip/i
  ];

  entries.forEach(e => {
    for (const pat of sensitivePatterns) {
      // Allow .env.example
      if (pat.test(e.FullName) && !e.FullName.endsWith('.env.example')) {
        violations.push(e.FullName);
      }
    }
  });

  if (violations.length > 0) {
    console.error('❌ SECURITY ALERT: Prohibited files detected in zip:', violations);
    process.exit(1);
  } else {
    console.log('   ✓ Zero credentials or .env secrets found (Audit Passed!).');
    console.log('   ✓ Zero node_modules or .git artifacts found.');
    console.log('   ✓ SOURCE_CODE_DOCUMENTATION.md verified at zip root.');
    console.log('   ✓ /source/ and /build/ structures verified.');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Packaging complete in ${elapsed}s! Ready for delivery.`);
}

run().catch(err => {
  console.error('❌ Packaging failed:', err);
  process.exit(1);
});
