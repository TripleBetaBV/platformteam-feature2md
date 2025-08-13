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

// Generate a tag for the badge, containing the name of the feature, scenario or scenario outline
function getBadgeTag(featureName, scenarioName, scenarioOutlineName)
{
  if (!featureName) {
    console.warn('Feature name is required for badge generation.');
    return '';
  }

  if (scenarioName) {
    return `<span class="bdd-badge-scenario" data-feature="${featureName}" data-scenario="${scenarioName}">${scenarioName}</span>`;
  }

  if (scenarioOutlineName) {
    return `<span class="bdd-badge-scenario-outline" data-feature="${featureName}" data-scenario-outline="${scenarioOutlineName}">${scenarioOutlineName}</span>`;
  }

  return `<span class="bdd-badge-feature" data-feature="${featureName}">${featureName}</span>`;
}

// Handle Scenario Outline differently - you can customize the behavior here
function handleScenarioOutline(scenario, featureName) {
  console.log(`Processing Scenario Outline: ${scenario.name}`);
  
  // You can add custom logic here for scenario outlines
  // For example, you might want to:
  // 1. Add different styling/badges
  // 2. Process the examples table differently
  // 3. Generate badges for each example row
  
  if (scenario.examples && scenario.examples.length > 0) {
    console.log(`  Found ${scenario.examples.length} examples table(s)`);
    scenario.examples.forEach((exampleTable, index) => {
      if (exampleTable.tableBody) {
        console.log(`  Examples table ${index + 1} has ${exampleTable.tableBody.length} data rows`);
      }
    });
  }
  
  return getBadgeTag(featureName, null, scenario.name);
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
      // Check if this is a Scenario Outline by looking at the keyword
      if (child.scenario.keyword && child.scenario.keyword.trim() === 'Scenario Outline') {
        console.log(`Adding badge to scenario outline: ${child.scenario.name}`);
        child.scenario.name = handleScenarioOutline(child.scenario, featureName);
      } else {
        console.log(`Adding badge to scenario: ${child.scenario.name}`);
        child.scenario.name = getBadgeTag(featureName, child.scenario.name);
      }
      continue;
    }

    // Scenario Outline directly under feature (fallback, shouldn't be needed)
    if (child.scenarioOutline) {
      console.log(`Adding badge to scenario outline: ${child.scenarioOutline.name}`);
      child.scenarioOutline.name = handleScenarioOutline(child.scenarioOutline, featureName);
      continue;
    }

    // Scenario nested under rule
    if (child.rule) {
      console.log(`Processing scenarios under rule: ${child.rule.name}`);
      for (const scenarioUnderRule of child.rule.children) {
        if (scenarioUnderRule.scenario) {
          // Check if this is a Scenario Outline by looking at the keyword
          if (scenarioUnderRule.scenario.keyword && scenarioUnderRule.scenario.keyword.trim() === 'Scenario Outline') {
            console.log(`  Adding badge to scenario outline: ${scenarioUnderRule.scenario.name}`);
            scenarioUnderRule.scenario.name = handleScenarioOutline(scenarioUnderRule.scenario, featureName);
          } else {
            console.log(`  Adding badge to scenario: ${scenarioUnderRule.scenario.name}`);
            scenarioUnderRule.scenario.name = getBadgeTag(featureName, scenarioUnderRule.scenario.name);
          }
        } else if (scenarioUnderRule.scenarioOutline) {
          console.log(`  Adding badge to scenario outline: ${scenarioUnderRule.scenarioOutline.name}`);
          // Handle Scenario Outline under rule differently (fallback)
          scenarioUnderRule.scenarioOutline.name = handleScenarioOutline(scenarioUnderRule.scenarioOutline, featureName);
        }
      }
    }
  }

  // Save the converted Markdown to a new file
  // At the top, add a badge for the latest build
  const latestBuildBadge = `<p style="text-align:right"><span class="bdd-badge-latestbuild-tooltip"><span class="bdd-badge-latestbuild"></span></span></p>\n`;
  const markdown = pretty(gherkinDocument, 'markdown');
  const outPath = featurePath.replace(/\.feature/, '.generated.md');
  fs.writeFileSync(outPath, latestBuildBadge+markdown);
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
export { findFeatureFiles, getBadgeTag, handleScenarioOutline, convertFeatureToMarkdown, main };

main();

// Run main function only if this file is executed directly
//if (import.meta.url === `file://${process.argv[1]}`) {
// main();
//}
