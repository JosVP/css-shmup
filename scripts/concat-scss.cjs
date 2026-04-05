const fs = require('fs').promises;
const path = require('path');

(async () => {
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const stylesDir = path.join(projectRoot, 'src', 'styles');
    const entry = path.join(stylesDir, 'main.scss');
    const outDir = path.join(projectRoot, 'dist');
    const outFile = path.join(outDir, 'concat.scss');

    await fs.mkdir(outDir, { recursive: true });

    const main = await fs.readFile(entry, 'utf8');
    const lines = main.split(/\r?\n/);

    // Collect top comments (before first @use/@import), ordered @use lines from main, and ordered imports
    // capture @use with module and optional alias; capture @import target
    const useRe = /^\s*@use\s+(['"])([^'"\s]+)\1(?:\s+as\s+([A-Za-z0-9_-]+))?\s*;?\s*$/;
    const importRe = /^\s*@import\s+['"]([^'"\s]+)['"]\s*;?\s*$/;

    let firstSpecial = lines.findIndex(l => useRe.test(l) || importRe.test(l));
    if (firstSpecial === -1) firstSpecial = 0;

    const topComments = lines.slice(0, firstSpecial);
    const remaining = lines.slice(firstSpecial);

    const useOrder = [];
    const useSet = new Set(); // store module names only to dedupe regardless of quoting or alias
    const imports = [];

    for (const line of remaining) {
      const useMatch = useRe.exec(line);
      const importMatch = importRe.exec(line);
      if (useMatch) {
        const moduleName = useMatch[2];
        const alias = useMatch[3];
        if (!useSet.has(moduleName)) {
          useSet.add(moduleName);
          // standardize to single quotes and include alias if present
          const useLine = alias ? `@use '${moduleName}' as ${alias};` : `@use '${moduleName}';`;
          useOrder.push(useLine);
        }
      } else if (importMatch) {
        imports.push(importMatch[1]);
      } else if (line.trim() === '') {
        // skip
      } else {
        // other lines after imports — keep as top comments
        topComments.push(line);
      }
    }

    const fileContents = [];

    // For each import, try to resolve the actual scss file (with or without underscore)
    for (const imp of imports) {
      let resolved = null;

      const candidates = [
        path.join(stylesDir, imp + '.scss'),
        path.join(stylesDir, '_' + imp + '.scss'),
        path.join(stylesDir, imp, 'index.scss'),
        path.join(stylesDir, imp, '_index.scss'),
      ];

      for (const c of candidates) {
        try {
          const stat = await fs.stat(c);
          if (stat.isFile()) {
            resolved = c;
            break;
          }
        } catch (e) {
          // ignore
        }
      }

      if (!resolved) {
        console.warn(`Warning: could not find import "${imp}" in ${stylesDir} (skipping)`);
        continue;
      }

      const raw = await fs.readFile(resolved, 'utf8');

      // Strip any @use / @import lines from inlined files, but keep unique @use lines
      const parts = raw.split(/\r?\n/);
      const cleaned = [];
      for (const pl of parts) {
        const um = useRe.exec(pl);
        const im = importRe.exec(pl);
        if (um) {
          const moduleName = um[2];
          const alias = um[3];
          if (!useSet.has(moduleName)) {
            useSet.add(moduleName);
            const useLine = alias ? `@use '${moduleName}' as ${alias};` : `@use '${moduleName}';`;
            useOrder.push(useLine);
          }
          continue; // don't include this line in the file body
        }
        if (im) {
          // skip imports from inlined files
          continue;
        }
        cleaned.push(pl);
      }

      fileContents.push(cleaned.join('\n').trim());
    }

    let out = '';

    // Keep top comments (TODO etc.)
    if (topComments.length) {
      out += topComments.join('\n') + '\n\n';
    }

    // Write unique @use lines once
    if (useOrder.length) {
      out += useOrder.join('\n') + '\n\n';
    }

    // Append concatenated file bodies
    if (fileContents.length) {
      out += fileContents.filter(Boolean).join('\n\n') + '\n';
    }

    await fs.writeFile(outFile, out, 'utf8');
    console.log(`Wrote concatenated SCSS to ${outFile}`);
  } catch (err) {
    console.error('Error during concat:', err);
    process.exitCode = 1;
  }
})();
