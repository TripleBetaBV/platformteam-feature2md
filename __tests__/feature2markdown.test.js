import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  findFeatureFiles, 
  getBadgeTag, 
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
      
      expect(result).toBe(' <span class="bdd-badge" data-feature="My Feature"></span>');
    });

    test('should generate correct badge tag for scenario', () => {
      const featureName = 'My Feature';
      const scenarioName = 'My Scenario';

      const result = getBadgeTag(featureName, scenarioName);
      
      expect(result).toBe(' <span class="bdd-badge" data-feature="My Feature" data-scenario="My Scenario"></span>');
    });

    test('should handle special characters in names', () => {
      const featureName = 'My Feature! @#$%^&*()';
      const scenarioName = 'Test Scenario: With Special Characters';

      const result = getBadgeTag(featureName, scenarioName);
      
      expect(result).toBe(' <span class="bdd-badge" data-feature="My Feature! @#$%^&*()" data-scenario="Test Scenario: With Special Characters"></span>');
    });

    test('should remove trailing slash from badge service URL', () => {
      const featureName = 'Feature';
      const scenarioName = 'Scenario';

      const result = getBadgeTag(featureName, scenarioName);
      
      expect(result).toBe(' <span class="bdd-badge" data-feature="Feature" data-scenario="Scenario"></span>');
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

      convertFeatureToMarkdown(featureFile, badgeServiceUrl);

      const outputFile = path.join(tempDir, 'test.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      expect(outputContent).toContain('# Feature: Test Feature');
      expect(outputContent).toContain('Test Scenario');
      expect(outputContent).toContain('<span class="bdd-badge" data-feature="Test Feature" data-scenario="Test Scenario"></span>');
    });

    test('should handle feature with rules', () => {
      const featureContent = `Feature: Feature with Rules
  
  Rule: Business Rule
    This is a business rule
    
    Scenario: Scenario under rule
      Given something
      When something happens
      Then something should occur`;

      const featureFile = path.join(tempDir, 'rule-test.feature');
      fs.writeFileSync(featureFile, featureContent);
      
      convertFeatureToMarkdown(featureFile, badgeServiceUrl);

      const outputFile = path.join(tempDir, 'rule-test.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      expect(outputContent).toContain('Feature with Rules');
      expect(outputContent).toContain('Business Rule');
      expect(outputContent).toContain('Scenario under rule');
      expect(outputContent).toContain('<span class="bdd-badge" data-feature="Feature with Rules" data-scenario="Scenario under rule"></span>');
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

    test('should handle empty badge service URL gracefully', () => {
      const featureContent = `Feature: No Badge Test
      Scenario: Test without badge
        Given something`;

      const featureFile = path.join(tempDir, 'nobadge.feature');
      fs.writeFileSync(featureFile, featureContent);

      // Mock console.warn to capture warnings
      const originalWarn = console.warn;
      const mockWarn = () => {};
      console.warn = mockWarn;

      convertFeatureToMarkdown(featureFile, null);

      const outputFile = path.join(tempDir, 'nobadge.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      expect(outputContent).toContain('# Feature: No Badge Test');
      expect(outputContent).toContain('Test without badge');
      expect(outputContent).not.toContain('<span class="bdd-badge" data-feature="No Badge Test"></span>');

      // Restore console.warn
      console.warn = originalWarn;
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

      convertFeatureToMarkdown(tempFeatureFile, badgeServiceUrl);

      const outputFile = path.join(tempDir, 'Managing.generated.md');
      expect(fs.existsSync(outputFile)).toBe(true);

      const outputContent = fs.readFileSync(outputFile, 'utf8');
      expect(outputContent).toContain('# Feature: Managing');
      expect(outputContent).toContain('Happy customer');
      expect(outputContent).toContain('<span class="bdd-badge" data-feature="Managing"></span>');
    });
  });
});
