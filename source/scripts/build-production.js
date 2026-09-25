/**
 * Travel Nexus - Automated Production Build Pipeline
 * Minifies all CSS and JavaScript source code using esbuild ("object code" equivalent),
 * rewires index.html and sw.js to consume minified assets, copies static assets into dist/,
 * and produces OBJECT_CODE_README.md with exact source-to-object mappings and size savings.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function build() {
  console.log('🚀 Starting Travel Nexus Production Build (Object Code Generation)...');
  const startTime = Date.now();

  // 1. Clean and initialize dist directory structure
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(DIST_DIR, 'css'), { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, 'js'), { recursive: true });

  const metrics = [];

  // 2. Minify CSS Stylesheets
  const cssFiles = ['variables.css', 'base.css', 'components.css', 'pages.css', 'responsive.css'];
  console.log('\n🎨 Minifying CSS files...');
  for (const file of cssFiles) {
    const srcPath = path.join(ROOT_DIR, 'css', file);
    const outFileName = file.replace(/\.css$/, '.min.css');
    const outPath = path.join(DIST_DIR, 'css', outFileName);

    const origSize = fs.statSync(srcPath).size;
    await esbuild.build({
      entryPoints: [srcPath],
      outfile: outPath,
      minify: true,
      legalComments: 'none'
    });
    const minSize = fs.statSync(outPath).size;
    const savings = (((origSize - minSize) / origSize) * 100).toFixed(1);

    metrics.push({
      type: 'CSS',
      source: `css/${file}`,
      target: `css/${outFileName}`,
      origSize,
      minSize,
      savings: `${savings}%`
    });
    console.log(`  ✓ css/${file} -> css/${outFileName} (${formatBytes(origSize)} -> ${formatBytes(minSize)}, -${savings}%)`);
  }

  // 3. Minify JavaScript Files
  const jsFiles = [
    'data.js',
    'states-data.js',
    'map.js',
    'filters.js',
    'planner.js',
    'modals.js',
    'states.js',
    'host.js',
    'firebase-service.js',
    'firebase-config.js',
    'auth.js',
    'admin.js',
    'router.js',
    'chat.js',
    'scroll-reveal.js',
    'app.js'
  ];
  console.log('\n⚡ Minifying JavaScript files...');
  for (const file of jsFiles) {
    const srcPath = path.join(ROOT_DIR, 'js', file);
    if (!fs.existsSync(srcPath)) continue;
    const outFileName = file.replace(/\.js$/, '.min.js');
    const outPath = path.join(DIST_DIR, 'js', outFileName);

    const origSize = fs.statSync(srcPath).size;
    await esbuild.build({
      entryPoints: [srcPath],
      outfile: outPath,
      minify: true,
      target: 'es2020',
      legalComments: 'none'
    });
    const minSize = fs.statSync(outPath).size;
    const savings = (((origSize - minSize) / origSize) * 100).toFixed(1);

    metrics.push({
      type: 'JS',
      source: `js/${file}`,
      target: `js/${outFileName}`,
      origSize,
      minSize,
      savings: `${savings}%`
    });
    console.log(`  ✓ js/${file} -> js/${outFileName} (${formatBytes(origSize)} -> ${formatBytes(minSize)}, -${savings}%)`);
  }

  // 4. Minify Service Worker sw.js and rewire asset cache paths
  console.log('\n📦 Processing Service Worker (sw.js)...');
  const swSrcPath = path.join(ROOT_DIR, 'sw.js');
  let swContent = fs.readFileSync(swSrcPath, 'utf8');
  // Update cache asset list in sw.js to point to .min.css and .min.js
  cssFiles.forEach(f => {
    const orig = `/css/${f}`;
    const min = `/css/${f.replace(/\.css$/, '.min.css')}`;
    swContent = swContent.split(`'${orig}'`).join(`'${min}'`);
    swContent = swContent.split(`"${orig}"`).join(`"${min}"`);
  });
  jsFiles.forEach(f => {
    const orig = `/js/${f}`;
    const min = `/js/${f.replace(/\.js$/, '.min.js')}`;
    swContent = swContent.split(`'${orig}'`).join(`'${min}'`);
    swContent = swContent.split(`"${orig}"`).join(`"${min}"`);
  });

  const swTempPath = path.join(DIST_DIR, 'sw.temp.js');
  fs.writeFileSync(swTempPath, swContent, 'utf8');
  const swDestPath = path.join(DIST_DIR, 'sw.js');
  const swOrigSize = fs.statSync(swSrcPath).size;
  await esbuild.build({
    entryPoints: [swTempPath],
    outfile: swDestPath,
    minify: true,
    target: 'es2020',
    legalComments: 'none'
  });
  fs.unlinkSync(swTempPath);
  const swMinSize = fs.statSync(swDestPath).size;
  const swSavings = (((swOrigSize - swMinSize) / swOrigSize) * 100).toFixed(1);
  metrics.push({
    type: 'PWA',
    source: 'sw.js',
    target: 'sw.js',
    origSize: swOrigSize,
    minSize: swMinSize,
    savings: `${swSavings}%`
  });
  console.log(`  ✓ sw.js (Rewired & Minified) (${formatBytes(swOrigSize)} -> ${formatBytes(swMinSize)}, -${swSavings}%)`);

  // 5. Update index.html to link to .min.css and .min.js
  console.log('\n📄 Rewiring and copying index.html...');
  const indexSrcPath = path.join(ROOT_DIR, 'index.html');
  let indexContent = fs.readFileSync(indexSrcPath, 'utf8');

  // Replace CSS link hrefs
  cssFiles.forEach(f => {
    const minName = f.replace(/\.css$/, '.min.css');
    indexContent = indexContent.replace(`href="css/${f}"`, `href="css/${minName}"`);
  });

  // Replace JS script srcs
  jsFiles.forEach(f => {
    const minName = f.replace(/\.js$/, '.min.js');
    indexContent = indexContent.replace(`src="js/${f}"`, `src="js/${minName}"`);
  });

  const indexDestPath = path.join(DIST_DIR, 'index.html');
  fs.writeFileSync(indexDestPath, indexContent, 'utf8');
  console.log('  ✓ index.html generated with production asset tags.');

  // 6. Copy manifest.json and images/
  console.log('\n🖼️  Copying static assets (manifest.json, images/)...');
  fs.copyFileSync(path.join(ROOT_DIR, 'manifest.json'), path.join(DIST_DIR, 'manifest.json'));
  console.log('  ✓ manifest.json copied.');

  const imagesSrcDir = path.join(ROOT_DIR, 'images');
  const imagesDestDir = path.join(DIST_DIR, 'images');
  copyDirSync(imagesSrcDir, imagesDestDir);
  console.log('  ✓ images/ directory copied.');

  // 7. Calculate total savings
  const totalOrig = metrics.reduce((acc, m) => acc + m.origSize, 0);
  const totalMin = metrics.reduce((acc, m) => acc + m.minSize, 0);
  const totalSavings = (((totalOrig - totalMin) / totalOrig) * 100).toFixed(1);

  // 8. Generate OBJECT_CODE_README.md inside dist/
  const readmeContent = `# Travel Nexus — Object Code & Production Build Documentation

> **Directory**: \`dist/\`  
> **Classification**: Production Build ("Object Code" Equivalent)  
> **Generated**: ${new Date().toISOString().split('T')[0]}  
> **Toolchain**: \`esbuild\` (v${esbuild.version})  

---

## 1. What Is "Object Code" for a Web Project?

In traditional compiled languages (such as C, C++, or Go), the compiler transforms human-readable source code into machine-language binary instructions termed **object code** (\`.o\`, \`.obj\`, \`.exe\`).

In client-side web applications (JavaScript, CSS, HTML), code is interpreted and dynamically compiled Just-In-Time (JIT) by client browser engines (e.g., Google Chrome V8). Therefore, there are no machine-code binaries. In the modern web ecosystem, the **direct functional equivalent of object code** is this **minified, bundled production build**:
1. **Minification & Identifier Mangling**: Variable and parameter names are reduced to minimal tokens, removing line breaks, redundant tokens, and developer comments.
2. **Whitespace Stripping & Grammar Optimization**: Reduces parsing overhead for browser engines.
3. **Dead Code Elimination**: Prunes unused branches and unreferenced statements.
4. **Optimized Delivery**: Yields the smallest possible byte payload for rapid HTTP delivery and aggressive browser caching.

This \`dist/\` directory contains the complete, standalone, production-ready artifact ready for high-performance hosting on CDNs, edge networks, or static servers.

---

## 2. Source-to-Object File Mapping & Compression Metrics

| Type | Source File (Human-Readable) | Production File (Object Code) | Original Size | Minified Size | Payload Reduction |
| :--- | :--- | :--- | :---: | :---: | :---: |
${metrics.map(m => `| **${m.type}** | \`${m.source}\` | \`${m.target}\` | ${formatBytes(m.origSize)} | ${formatBytes(m.minSize)} | **-${m.savings}** |`).join('\n')}
| **TOTAL** | **All Core Code Assets** | **All Production Assets** | **${formatBytes(totalOrig)}** | **${formatBytes(totalMin)}** | **-${totalSavings}%** |

**Net Compression**: Shrunk source code from **${formatBytes(totalOrig)}** down to **${formatBytes(totalMin)}**, eliminating **${formatBytes(totalOrig - totalMin)}** of unnecessary transfer overhead (${totalSavings}% overall code reduction).

---

## 3. How to Test and Serve This Build

To verify the production build locally:

\`\`\`bash
# From the project root, serve the dist/ directory:
npx serve dist -p 3000
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Open DevTools (F12) -> Network tab.
- Notice all loaded stylesheets are \`.min.css\` and scripts are \`.min.js\`.
- All features (Search, Map markers, Filters, Stays, Auth modals, AI concierge) function seamlessly with instant response times.
`;

  fs.writeFileSync(path.join(DIST_DIR, 'OBJECT_CODE_README.md'), readmeContent, 'utf8');
  console.log('  ✓ OBJECT_CODE_README.md created inside dist/.');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ Production Build Complete in ${elapsed}s!`);
  console.log(`   Original Code Size: ${formatBytes(totalOrig)}`);
  console.log(`   Minified Code Size: ${formatBytes(totalMin)}`);
  console.log(`   Overall Code Reduction: -${totalSavings}%\n`);
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
