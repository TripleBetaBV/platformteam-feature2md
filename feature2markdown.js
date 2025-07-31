// =============================================================
// Feature2Markdown
//
// This script converts Gherkin feature files to Markdown format with badges for each scenario.
// It recursively searches for .feature files in the current directory and its subdirectories,
// parses them, and appends a badge tag to each feature name and scenario name.
//
// It is designed to be run from the command line and can be used in a CI/CD pipeline
//
// Usage: node feature2markdown.js
// =============================================================
import fs from 'fs';
import path from 'path';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { pretty } from '@cucumber/gherkin-utils';
import { IdGenerator } from '@cucumber/messages';

// Recursively find all feature files
function findFeatureFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(findFeatureFiles(filePath));
    } else if (file.isFile() && file.name.endsWith('.feature')) {
      results.push(filePath);
    }
  }
  return results;
}

// Generate a tag for the badge, containing the name of the feature and scenario
function getBadgeTag(featureName, scenarioName)
{
  if (!featureName) {
    console.warn('Feature name is required for badge generation.');
    return '';
  }

  if (!scenarioName) {
    return `<span class="bdd-badge-feature" data-feature="${featureName}">${featureName}</span>`;
  }
  return `<span class="bdd-badge-scenario" data-feature="${featureName}" data-scenario="${scenarioName}">${scenarioName}</span>`;
}

// Zet een feature-bestand om naar Markdown met badges
function convertFeatureToMarkdown(featurePath) {
  console.log(`Processing: ${featurePath}`);
  const featureText = fs.readFileSync(featurePath, 'utf8');
  const uuidFn = IdGenerator.uuid();
  const builder = new AstBuilder(uuidFn);
  const matcher = new GherkinClassicTokenMatcher();
  const parser = new Parser(builder, matcher);
  const gherkinDocument = parser.parse(featureText);

  console.log(`# items in feature: ${gherkinDocument.feature.children.length}`);
  
  // Add badge to the feature name
  const featureName = gherkinDocument.feature.name;
//  gherkinDocument.feature.name += getBadgeTag(featureName, null);
  gherkinDocument.feature.name = getBadgeTag(featureName, null);

  // Add badge to the scenario names
  for (const child of gherkinDocument.feature.children) {
    // Scenario directly under feature
    if (child.scenario) {
      console.log(`Adding badge to scenario: ${child.scenario.name}`);
//      child.scenario.name += getBadgeTag(featureName, child.scenario.name);
      child.scenario.name = getBadgeTag(featureName, child.scenario.name);
      continue;
    }

    // Scenario nested under rule
    if (child.rule) {
      console.log(`Processing scenarios under rule: ${child.rule.name}`);
      for (const scenarioUnderRule of child.rule.children) {
        console.log(`  Adding badge to scenario: ${scenarioUnderRule.scenario.name}`);
//        scenarioUnderRule.scenario.name += getBadgeTag(featureName, scenarioUnderRule.scenario.name);
        scenarioUnderRule.scenario.name = getBadgeTag(featureName, scenarioUnderRule.scenario.name);
      }
    }
  }

  // Save the converted Markdown to a new file
  // At the top, add a style block for the badges
  const markdown = pretty(gherkinDocument, 'markdown');
  const outPath = featurePath.replace(/\.feature/, '.generated.md');

  // Read the full content of the small-badges.css file
  const cssPath = path.join(path.dirname(import.meta.url.replace('file://', '')), 'styles', 'small-badges.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Add the CSS content to the top of the Markdown file
  const cssBlock = `\`\`\`css\n${cssContent}\n\`\`\`\n\n`;
  const markdownWithCss = cssBlock + markdown;  

  fs.writeFileSync(outPath, markdownWithCss);
  console.log(`Converted and stored as: ${outPath}`);
}

function main() {
  const featureFiles = findFeatureFiles(process.cwd());
  if (featureFiles.length === 0) {
    console.log(`No .feature-files found in ${process.cwd()}.`);
  } else {
    featureFiles.forEach(featurePath => convertFeatureToMarkdown(featurePath));
    console.log(`${featureFiles.length} feature files converted.`);
  }
}

// Export functions for testing
export { findFeatureFiles, getBadgeTag, convertFeatureToMarkdown, main };

// Run main function only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
