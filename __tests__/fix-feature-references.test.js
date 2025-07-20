import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  findMarkdownFiles, 
  replaceFeatureReferences 
} from '../fix-feature-references.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('fix-feature-references.js', () => {
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

  describe('findMarkdownFiles', () => {
    test('should find .md files in a directory', () => {
      // Create test structure
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir, { recursive: true });
      
      const mdFile1 = path.join(tempDir, 'test1.md');
      const mdFile2 = path.join(subDir, 'test2.md');
      const nonMdFile = path.join(tempDir, 'test.txt');
      
      fs.writeFileSync(mdFile1, '# Test 1');
      fs.writeFileSync(mdFile2, '# Test 2');
      fs.writeFileSync(nonMdFile, 'Not a markdown file');

      const result = findMarkdownFiles(tempDir);
      
      expect(result).toHaveLength(2);
      expect(result).toContain(mdFile1);
      expect(result).toContain(mdFile2);
      expect(result).not.toContain(nonMdFile);
    });

    test('should find .yaml and .yml files in a directory', () => {
      // Create test structure
      const yamlFile = path.join(tempDir, 'config.yaml');
      const ymlFile = path.join(tempDir, 'config.yml');
      const mdFile = path.join(tempDir, 'readme.md');
      
      fs.writeFileSync(yamlFile, 'key: value');
      fs.writeFileSync(ymlFile, 'key: value');
      fs.writeFileSync(mdFile, '# Readme');

      const result = findMarkdownFiles(tempDir);
      
      expect(result).toHaveLength(3);
      expect(result).toContain(yamlFile);
      expect(result).toContain(ymlFile);
      expect(result).toContain(mdFile);
    });

    test('should return empty array when no supported files exist', () => {
      const txtFile = path.join(tempDir, 'test.txt');
      fs.writeFileSync(txtFile, 'Just a text file');

      const result = findMarkdownFiles(tempDir);
      expect(result).toHaveLength(0);
    });

    test('should handle nested directories recursively', () => {
      const deepDir = path.join(tempDir, 'level1', 'level2', 'level3');
      fs.mkdirSync(deepDir, { recursive: true });
      
      const deepMdFile = path.join(deepDir, 'deep.md');
      const rootMdFile = path.join(tempDir, 'root.md');
      
      fs.writeFileSync(deepMdFile, '# Deep markdown');
      fs.writeFileSync(rootMdFile, '# Root markdown');

      const result = findMarkdownFiles(tempDir);
      
      expect(result).toHaveLength(2);
      expect(result).toContain(deepMdFile);
      expect(result).toContain(rootMdFile);
    });

    test('should handle empty directories', () => {
      const emptyDir = path.join(tempDir, 'empty');
      fs.mkdirSync(emptyDir);

      const result = findMarkdownFiles(tempDir);
      expect(result).toHaveLength(0);
    });
  });

  describe('replaceFeatureReferences', () => {
    test('should replace .feature references with .generated.md', () => {
      const content = `# Test Documentation

This links to [login.feature](features/login.feature) for authentication.

Also see signup.feature and admin.feature for more details.`;

      const expectedContent = `# Test Documentation

This links to [login.generated.md](features/login.generated.md) for authentication.

Also see signup.generated.md and admin.generated.md for more details.`;

      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(expectedContent);
    });

    test('should not replace .generated.md references (already converted)', () => {
      const content = `# Test Documentation

This already links to login.generated.md and signup.generated.md.`;

      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(content); // Should remain unchanged
    });

    test('should not replace .feature.yml references', () => {
      const content = `# Test Documentation

This links to config.feature.yml which should not be changed.
But this login.feature should be changed to login.generated.md.`;

      const expectedContent = `# Test Documentation

This links to config.feature.yml which should not be changed.
But this login.generated.md should be changed to login.generated.md.`;

      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(expectedContent);
    });

    test('should handle multiple .feature references on the same line', () => {
      const content = `See login.feature and signup.feature and admin.feature`;
      const expectedContent = `See login.generated.md and signup.generated.md and admin.generated.md`;

      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(expectedContent);
    });

    test('should handle .feature references in various contexts', () => {
      const content = `# Feature References

- [Login Feature](./features/login.feature)
- Check out user-management.feature
- See path/to/complex-feature-name.feature
- Also nested/deep/folder/test.feature
- URL: https://example.com/docs/api.feature
- File: ../parent/folder/feature.feature`;

      const expectedContent = `# Feature References

- [Login Feature](./features/login.generated.md)
- Check out user-management.generated.md
- See path/to/complex-feature-name.generated.md
- Also nested/deep/folder/test.generated.md
- URL: https://example.com/docs/api.generated.md
- File: ../parent/folder/feature.generated.md`;

      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(expectedContent);
    });

    test('should not modify file if no changes are needed', () => {
      const content = `# No Feature References

This file has no .feature references to replace.
It only mentions "feature" as a word.`;

      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      // Get original file stats
      const statsBefore = fs.statSync(testFile);
      
      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(content);
    });

    test('should handle empty files', () => {
      const content = '';
      const testFile = path.join(tempDir, 'empty.md');
      fs.writeFileSync(testFile, content);

      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(content);
    });

    test('should handle YAML files with feature references', () => {
      const content = `# YAML Configuration
features:
  - login.feature
  - signup.feature
docs: "See user-guide.feature for details"`;

      const expectedContent = `# YAML Configuration
features:
  - login.generated.md
  - signup.generated.md
docs: "See user-guide.generated.md for details"`;

      const testFile = path.join(tempDir, 'config.yml');
      fs.writeFileSync(testFile, content);

      replaceFeatureReferences(testFile);

      const result = fs.readFileSync(testFile, 'utf8');
      expect(result).toBe(expectedContent);
    });

    test('should log when file is updated', () => {
      const content = `Reference to login.feature`;
      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      // Mock console.log to capture calls
      const mockLog = () => {};
      const originalLog = console.log;
      let logCalled = false;
      console.log = (message) => {
        if (message.includes('Updated:')) {
          logCalled = true;
        }
      };

      replaceFeatureReferences(testFile);

      expect(logCalled).toBe(true);

      // Restore console.log
      console.log = originalLog;
    });

    test('should not log when file is not updated', () => {
      const content = `No feature references here`;
      const testFile = path.join(tempDir, 'test.md');
      fs.writeFileSync(testFile, content);

      // Mock console.log to capture calls
      let logCalled = false;
      const originalLog = console.log;
      console.log = (message) => {
        if (message.includes('Updated:')) {
          logCalled = true;
        }
      };

      replaceFeatureReferences(testFile);

      expect(logCalled).toBe(false);

      // Restore console.log
      console.log = originalLog;
    });
  });

  describe('Integration tests', () => {
    test('should process multiple files in a directory structure', () => {
      // Create a complex directory structure
      const docsDir = path.join(tempDir, 'docs');
      const featuresDir = path.join(tempDir, 'features');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.mkdirSync(featuresDir, { recursive: true });

      // Create test files
      const readmeContent = `# Project README

See the following features:
- [Login](features/login.feature)
- [Signup](features/signup.feature)`;

      const docsContent = `# Documentation

Reference: ../features/admin.feature
Also see user-management.feature`;

      const configContent = `# Config
features:
  - login.feature
  - admin.feature`;

      fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent);
      fs.writeFileSync(path.join(docsDir, 'guide.md'), docsContent);
      fs.writeFileSync(path.join(featuresDir, 'config.yml'), configContent);

      // Find and process all files
      const allFiles = findMarkdownFiles(tempDir);
      expect(allFiles).toHaveLength(3);

      allFiles.forEach(replaceFeatureReferences);

      // Check results
      const updatedReadme = fs.readFileSync(path.join(tempDir, 'README.md'), 'utf8');
      expect(updatedReadme).toContain('login.generated.md');
      expect(updatedReadme).toContain('signup.generated.md');

      const updatedDocs = fs.readFileSync(path.join(docsDir, 'guide.md'), 'utf8');
      expect(updatedDocs).toContain('admin.generated.md');
      expect(updatedDocs).toContain('user-management.generated.md');

      const updatedConfig = fs.readFileSync(path.join(featuresDir, 'config.yml'), 'utf8');
      expect(updatedConfig).toContain('login.generated.md');
      expect(updatedConfig).toContain('admin.generated.md');
    });

    test('should handle edge case with mixed file types', () => {
      const mdContent = `# Markdown
Link to test.feature`;

      const yamlContent = `# YAML
feature: test.feature`;

      const ymlContent = `# YML  
ref: test.feature`;

      fs.writeFileSync(path.join(tempDir, 'test.md'), mdContent);
      fs.writeFileSync(path.join(tempDir, 'test.yaml'), yamlContent);
      fs.writeFileSync(path.join(tempDir, 'test.yml'), ymlContent);

      const allFiles = findMarkdownFiles(tempDir);
      allFiles.forEach(replaceFeatureReferences);

      // All should be updated
      expect(fs.readFileSync(path.join(tempDir, 'test.md'), 'utf8')).toContain('test.generated.md');
      expect(fs.readFileSync(path.join(tempDir, 'test.yaml'), 'utf8')).toContain('test.generated.md');
      expect(fs.readFileSync(path.join(tempDir, 'test.yml'), 'utf8')).toContain('test.generated.md');
    });
  });
});
