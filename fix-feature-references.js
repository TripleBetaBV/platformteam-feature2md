// =============================================================
// Feature2Markdown
//
// Recursively searches for references to .feature files
// in Markdown files and replaces them with .feature.md references.
// =============================================================
import fs from 'fs';
import path from 'path';

function findMarkdownFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findMarkdownFiles(filePath));
        } else if (filePath.endsWith('.md')) {
            results.push(filePath);
        } else if (filePath.endsWith('.yaml')) {
            results.push(filePath);
        } else if (filePath.endsWith('.yml')) {
            results.push(filePath);
        }
    });
    return results;
}

function replaceFeatureReferences(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace any string ending with .feature (not already .feature.md or .feature.yml)
    const replaced = content.replace(/(\S+?\.feature)(?!\.(?:md|yml|yaml)\b)/g, (match) => {
        return match.replace(/\.feature$/, '.generated.md');
    });
    if (replaced !== content) {
        fs.writeFileSync(filePath, replaced, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function main() {
    const baseDir = process.cwd();
    const mdFiles = findMarkdownFiles(baseDir);
    mdFiles.forEach(replaceFeatureReferences);
}

// Export functions for testing
export { findMarkdownFiles, replaceFeatureReferences, main };

// Run main function only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}