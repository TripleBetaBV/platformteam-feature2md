// =============================================================
// Feature2Markdown
//
// This script converts Gherkin feature files to Markdown format with badges for each scenario.
// It recursively searches for .feature files in the current directory and its subdirectories,
// parses them, and appends a badge URL to each scenario name.
// The badge URL is generated based on a provided badge service URL, feature name, and scenario name.
//
// Usage: node feature2markdown.js <badgeServiceUrl>
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
    return `<span class="bdd-badge" data-feature="${featureName}"></span>`;
  }
  return `<span class="bdd-badge" data-feature="${featureName}" data-scenario="${scenarioName}"></span>`;
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
  
  // Add badge to the scenario names
  for (const child of gherkinDocument.feature.children) {
    // Scenario nested under rule
    if (child.rule) {
      for (const scenario of child.rule.children) {
        console.log(`Adding badge to scenario: ${scenario.scenario.name}`);
        const badge = getBadgeTag(gherkinDocument.feature.name);
        scenario.scenario.name += badge;
      }
    }

    // Scenario directly under feature
    if (child.scenario) {
      console.log(`Adding badge to scenario: ${child.scenario.name}`);
      const badge = getBadgeTag(gherkinDocument.feature.name, child.scenario.name);
      child.scenario.name += badge;
    }
  }

  const markdown = pretty(gherkinDocument, 'markdown');
  const outPath = featurePath.replace(/\.feature/, '.generated.md');
  fs.writeFileSync(outPath, markdown);
  console.log(`Converted and stored as: ${outPath}`);
}

// print process.argv
function validateArgs() {
  process.argv.forEach(function (val, index, array) {
    // 1 commandline argument is required for the badge service URL
    if (index === 2) {
      if (!val.startsWith('http')) {
        console.error('Badge service URL must start with http or https.');
        process.exit(1);
      }
    }
  });
}

function main() {
  const featureFiles = findFeatureFiles(process.cwd());
  if (featureFiles.length === 0) {
    console.log(`No .feature-files found in ${process.cwd()}.`);
  } else {
    let badgeServiceUrl = process.argv[2];
    featureFiles.forEach(featurePath => convertFeatureToMarkdown(featurePath, badgeServiceUrl));
    console.log(`${featureFiles.length} feature files converted.`);
  }
}

// Export functions for testing
export { findFeatureFiles, getBadgeTag, convertFeatureToMarkdown, validateArgs, main };

// Run main function only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateArgs();
  main();
}
