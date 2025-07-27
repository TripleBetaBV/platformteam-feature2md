# Gherkin to markdown converter

Utility designed to run in the build pipeline of techdocs.
It finds all the .feature files in the current path and subdirectories and
creates a markdown representation.

Each .feature file will get its corresponding .feature.md file next to it.
It will also detect any reference to a .feature file in any of the markdown files
and will replace it with a reference to its corresponding .feature.md file.

It will add a special tag at the end of each feature or scenario title:
```html
<div class="bdd-badge" data-feature="Name of feature" data-scenario="Scenario name"></div>
```
The Bdd Techdocs addon will detect these tags and replaces them with a badge to show the current status of the test, using the latest Azure Devops test result. 

The techdocs / mkdocs CLI will then include them in the documentation.