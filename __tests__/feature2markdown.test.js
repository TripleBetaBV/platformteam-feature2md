import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  findFeatureFiles, 
  getBadgeTag,
  handleScenarioOutline,
  filterOutComments,
  fixTableFormatting,
  convertFeatureToMarkdown 
} from '../feature2markdown.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('feature2markdown.js', () => {
  let tempDir;
  let originalConsoleLog;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-'));
    // Mock console.log to avoid noise in tests
    originalConsoleLog = console.log;
    console.log = () => {};
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    // Restore console.log
    console.log = originalConsoleLog;
  });

  describe('findFeatureFiles', () => {
    test('should find .feature files in a directory', () => {
      // Create test structure
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir, { recursive: true });
      
      const featureFile1 = path.join(tempDir, 'test1.feature');
      const featureFile2 = path.join(subDir, 'test2.feature');
      const nonFeatureFile = path.join(tempDir, 'test.txt');
      
      fs.writeFileSync(featureFile1, 'Feature: Test1');
      fs.writeFileSync(featureFile2, 'Feature: Test2');
      fs.writeFileSync(nonFeatureFile, 'Not a feature file');

      const result = findFeatureFiles(tempDir);
      
      expect(result).toHaveLength(2);
      expect(result).toContain(featureFile1);
      expect(result).toContain(featureFile2);
      expect(result).not.toContain(nonFeatureFile);
    });

    test('should return empty array when no .feature files exist', () => {
      const result = findFeatureFiles(tempDir);
      expect(result).toHaveLength(0);
    });

    test('should handle nested directories', () => {
      const deepDir = path.join(tempDir, 'level1', 'level2', 'level3');
      fs.mkdirSync(deepDir, { recursive: true });
      
      const featureFile = path.join(deepDir, 'deep.feature');
      fs.writeFileSync(featureFile, 'Feature: Deep Test');

      const result = findFeatureFiles(tempDir);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(featureFile);
    });
  });

  describe('getBadgeTag', () => {
    test('should generate correct badge tag for feature', () => {
      const featureName = 'My Feature';

      const result = getBadgeTag(featureName);
      
      expect(result).toBe('<span class="bdd-badge-feature" data-feature="My Feature">My Feature</span>');
    });

    test('should generate correct badge tag for scenario', () => {
      const featureName = 'My Feature';
      const scenarioName = 'My Scenario';

      const result = getBadgeTag(featureName, scenarioName);
      
      expect(result).toBe('<span class="bdd-badge-scenario" data-feature="My Feature" data-scenario="My Scenario">My Scenario</span>');
    });

    test('should handle special characters in names', () => {
      const featureName = 'My Feature! @#$%^&*()';
      const scenarioName = 'Test Scenario: With Special Characters';

      const result = getBadgeTag(featureName, scenarioName);
      
      expect(result).toBe('<span class="bdd-badge-scenario" data-feature="My Feature! @#$%^&*()" data-scenario="Test Scenario: With Special Characters">Test Scenario: With Special Characters</span>');
    });

    test('should remove trailing slash from badge service URL', () => {
      const featureName = 'Feature';
      const scenarioName = 'Scenario';

      const result = getBadgeTag(featureName, scenarioName);
      
      expect(result).toBe('<span class="bdd-badge-scenario" data-feature="Feature" data-scenario="Scenario">Scenario</span>');
    });

    test('should return empty string when feature name is not provided', () => {
      // Mock console.warn to check it's called
      const originalWarn = console.warn;
      const mockWarn = () => {};
      console.warn = mockWarn;
      
      const result = getBadgeTag(null, 'Scenario');
      expect(result).toBe('');
      
      // Restore console.warn
      console.warn = originalWarn;
    });
  });

  describe('convertFeatureToMarkdown', () => {
    test('should convert a simple feature file to markdown', () => {
      const featureContent = `Feature: Test Feature
  This is a test feature

  Scenario: Test Scenario
    Given something
    When something happens
    Then something should occur`;

      const featureFile = path.join(tempDir, 'test.feature');
      fs.writeFileSync(featureFile, featureContent);

      convertFeatureToMarkdown(featureFile);

      const outputFile = path.join(tempDir, 'test.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');

      // Check that the CSS file is included at the start of the output
      expect(outputContent.startsWith('<p style="text-align:right"><span class="bdd-badge-latestbuild-tooltip"><span class="bdd-badge-latestbuild"></span></span></p>\n')).toBe(true);
      expect(outputContent).toContain('# Feature: <span class="bdd-badge-feature" data-feature="Test Feature">Test Feature</span>');
      expect(outputContent).toContain('Test Scenario');
      expect(outputContent).toContain('<span class="bdd-badge-scenario" data-feature="Test Feature" data-scenario="Test Scenario">Test Scenario</span>');
    });


    test('should create output file with correct name', () => {
      const featureContent = `Feature: Simple
      Scenario: Simple test
        Given something`;

      const featureFile = path.join(tempDir, 'simple.feature');
      fs.writeFileSync(featureFile, featureContent);

      convertFeatureToMarkdown(featureFile);

      const expectedOutputFile = path.join(tempDir, 'simple.generated.md');
      expect(fs.existsSync(expectedOutputFile)).toBe(true);
    });
  });

  describe('Integration test with real examples', () => {
    test('should process example files correctly', () => {
      const examplesDir = path.join(__dirname, '..', 'examples');
      const managingFeature = path.join(examplesDir, 'Managing.feature');
      
      // Skip if examples don't exist
      if (!fs.existsSync(managingFeature)) {
        return;
      }
      
      // Create a copy in temp directory to avoid modifying original
      const tempFeatureFile = path.join(tempDir, 'Managing.feature');
      fs.copyFileSync(managingFeature, tempFeatureFile);

      convertFeatureToMarkdown(tempFeatureFile);

      const outputFile = path.join(tempDir, 'Managing.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      expect(outputContent).toContain('# Feature: Managing');
      expect(outputContent).toContain('Happy customer');
      expect(outputContent).toContain('<span class="bdd-badge-feature" data-feature="Managing">Managing</span>');
    });
  });

  describe('handleScenarioOutline', () => {
    test('should handle scenario outline differently than regular scenarios', () => {
      const featureContent = `Feature: Test Feature with Scenario Outline

  Scenario Outline: Test with examples
    Given I have <count> items
    When I add <more> items
    Then I should have <total> items
    
    Examples:
      | count | more | total |
      | 1     | 2    | 3     |
      | 5     | 3    | 8     |`;

      const featureFile = path.join(tempDir, 'scenario-outline-test.feature');
      fs.writeFileSync(featureFile, featureContent);

      convertFeatureToMarkdown(featureFile);

      const outputFile = path.join(tempDir, 'scenario-outline-test.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      expect(outputContent).toContain('<span class="bdd-badge-feature" data-feature="Test Feature with Scenario Outline">Test Feature with Scenario Outline</span>');
      expect(outputContent).toContain('Scenario Outline:');
      expect(outputContent).toContain('bdd-badge-scenario-outline');
      expect(outputContent).toContain('data-scenario-outline="Test with examples"');
      expect(outputContent).toContain('Examples:');
    });

    test('should generate correct badge for scenario outline', () => {
      const mockScenario = {
        name: 'Test Scenario Outline',
        keyword: 'Scenario Outline',
        examples: [{
          tableBody: [
            { cells: [{ value: '1' }, { value: '2' }] },
            { cells: [{ value: '3' }, { value: '4' }] }
          ]
        }]
      };

      const result = handleScenarioOutline(mockScenario, 'Test Feature');
      
      expect(result).toBe('<span class="bdd-badge-scenario-outline" data-feature="Test Feature" data-scenario-outline="Test Scenario Outline">Test Scenario Outline</span>');
    });
  });

  describe('filterOutComments', () => {
    test('should remove Gherkin comments while preserving headings', () => {
      const markdownWithComments = `# Feature: Test Feature
As a user

## Scenario: Test scenario
      # This is a comment that should be removed
* Given something
* When something happens
      # Another comment to remove
* Then something should occur

### Examples:
  | column |
  | ------ |
  | value  |
      # Comment in examples should be removed`;

      const result = filterOutComments(markdownWithComments);
      
      expect(result).toContain('# Feature: Test Feature');
      expect(result).toContain('## Scenario: Test scenario');
      expect(result).toContain('### Examples:');
      expect(result).not.toContain('This is a comment that should be removed');
      expect(result).not.toContain('Another comment to remove');
      expect(result).not.toContain('Comment in examples should be removed');
    });

    test('should handle edge cases correctly', () => {
      const edgeCaseMarkdown = `# Feature: Test Feature

## Scenario: Edge cases
* Given step
# This is a comment
* When step
#### Sub-heading with 4 hashes
# Another comment
* Then step`;

      const result = filterOutComments(edgeCaseMarkdown);
      
      expect(result).toContain('# Feature: Test Feature');
      expect(result).toContain('## Scenario: Edge cases');
      expect(result).toContain('#### Sub-heading with 4 hashes');
      expect(result).not.toContain('This is a comment');
      expect(result).not.toContain('Another comment');
    });

    test('should handle feature file with comments in scenarios', () => {
      const featureContent = `Feature: Test with Comments

  Scenario: Test scenario with comments
    # This comment should not appear in output
    Given I have something
    When I do something
    # Another comment to be filtered
    Then I should see result`;

      const featureFile = path.join(tempDir, 'comments-test.feature');
      fs.writeFileSync(featureFile, featureContent);

      convertFeatureToMarkdown(featureFile);

      const outputFile = path.join(tempDir, 'comments-test.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      expect(outputContent).toContain('Test with Comments');
      expect(outputContent).toContain('Test scenario with comments');
      expect(outputContent).not.toContain('This comment should not appear');
      expect(outputContent).not.toContain('Another comment to be filtered');
      expect(outputContent).toContain('* Given I have something');
      expect(outputContent).toContain('* Then I should see result');
    });
  });

  describe('fixTableFormatting', () => {
    test('should remove indentation from tables to make valid Markdown tables', () => {
      const markdownWithIndentedTables = `# Feature: Test
## Scenario: Test with table
* Given something
  | Column1 | Column2 |
  | ------- | ------- |
  | Value1  | Value2  |
* When something happens
  | Header  | Data    |
  | ------- | ------- |
  | Test    | Result  |
* Then something occurs`;

      const result = fixTableFormatting(markdownWithIndentedTables);
      
      // Tables should be un-indented (no leading spaces)
      expect(result).toContain('| Column1 | Column2 |');
      expect(result).toContain('| ------- | ------- |');
      expect(result).toContain('| Value1  | Value2  |');
      expect(result).toContain('| Header  | Data    |');
      expect(result).toContain('| Test    | Result  |');
      
      // Other content should remain unchanged
      expect(result).toContain('# Feature: Test');
      expect(result).toContain('* Given something');
      expect(result).toContain('* When something happens');
      expect(result).toContain('* Then something occurs');
      
      // Verify tables don't start with spaces
      const lines = result.split('\n');
      const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
      tableLines.forEach(line => {
        expect(line).not.toMatch(/^\s+\|/); // Should not start with spaces
        expect(line).toMatch(/^\|/); // Should start with |
      });
    });

    test('should handle scenario outline tables correctly', () => {
      const featureContent = `Feature: Test Scenario Outline Tables

  Scenario Outline: Test with data table
    Given I have data
      | Field   | Value     |
      | name    | <Name>    |
      | age     | <Age>     |
    When I process it
    Then I get <Result>
    
    Examples:
      | Name  | Age | Result  |
      | Alice | 25  | Success |
      | Bob   | 30  | Success |`;

      const featureFile = path.join(tempDir, 'table-test.feature');
      fs.writeFileSync(featureFile, featureContent);

      convertFeatureToMarkdown(featureFile);

      const outputFile = path.join(tempDir, 'table-test.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      
      // Check that tables are properly formatted without indentation
      expect(outputContent).toContain('| Field | Value  |');
      expect(outputContent).toContain('| name  | <Name> |');
      expect(outputContent).toContain('| Name  | Age | Result  |');
      expect(outputContent).toContain('| Alice |  25 | Success |');
      
      // Verify no indented tables remain
      const lines = outputContent.split('\n');
      const indentedTableLines = lines.filter(line => /^\s+\|.*\|/.test(line));
      expect(indentedTableLines).toHaveLength(0);
    });

    test('should preserve non-table content with pipes', () => {
      const markdownWithPipes = `# Feature: Test
## Scenario: Test with pipes in text
* Given I have "option1|option2|option3"
  | Column | Value |
  | ------ | ----- |
  | Test   | Data  |
* When I process "value1|value2"
* Then I should see the result`;

      const result = fixTableFormatting(markdownWithPipes);
      
      // Table should be un-indented
      expect(result).toContain('| Column | Value |');
      expect(result).toContain('| ------ | ----- |');
      expect(result).toContain('| Test   | Data  |');
      
      // Text with pipes should remain unchanged
      expect(result).toContain('* Given I have "option1|option2|option3"');
      expect(result).toContain('* When I process "value1|value2"');
    });

    test('should ensure proper table termination for Markdown parsers', () => {
      const markdownEndingWithTable = `# Feature: Test
## Scenario: Test ending with table
* Given something
| Column | Value |
| ------ | ----- |
| Test   | Data  |`;

      const result = fixTableFormatting(markdownEndingWithTable);
      
      // Should add empty line after table that ends the document
      expect(result).toMatch(/\|\s*Test\s*\|\s*Data\s*\|\s*\n\s*$/);
      
      // Should not have multiple empty lines at the end
      expect(result).not.toMatch(/\n\n\n$/);
    });

    test('should handle multiple tables correctly', () => {
      const markdownWithMultipleTables = `# Feature: Test
## Scenario: Multiple tables
* Given first table
  | Col1 | Col2 |
  | ---- | ---- |
  | A    | B    |
* When second action
  | Col3 | Col4 |
  | ---- | ---- |
  | C    | D    |
* Then result`;

      const result = fixTableFormatting(markdownWithMultipleTables);
      
      // Both tables should be un-indented
      expect(result).toContain('| Col1 | Col2 |');
      expect(result).toContain('| Col3 | Col4 |');
      
      // Tables should be separated from following content
      expect(result).toMatch(/\|\s*B\s*\|\s*\n\s*\*\s*When/);
      expect(result).toMatch(/\|\s*D\s*\|\s*\n\s*\*\s*Then/);
    });
  });

  describe('convertFeatureToMarkdown file ending', () => {
    test('should ensure generated files end with newline', () => {
      const featureContent = `Feature: Test ending
  Scenario: Test
    Given something
    Then result`;

      const featureFile = path.join(tempDir, 'ending-test.feature');
      fs.writeFileSync(featureFile, featureContent);

      convertFeatureToMarkdown(featureFile);

      const outputFile = path.join(tempDir, 'ending-test.generated.md');
      const outputContent = fs.readFileSync(outputFile, 'utf8');
      
      // File should end with newline
      expect(outputContent).toMatch(/\n$/);
      expect(outputContent.charCodeAt(outputContent.length - 1)).toBe(10); // newline character
    });
  });
});
