# Gherkin to markdown converter

Utility designed to run in the build pipeline of techdocs.
It finds all the .feature files in the current path and subdirectories and
creates a markdown representation.

Each .feature file will get its corresponding .feature.md file next to it.
It will also detect any reference to a .feature file in any of the markdown files
and will replace it with a reference to its corresponding .feature.md file.

It will add a special tags at the end of each feature or scenario title:
```html
<span class="bdd-badge-feature" data-feature="Name of feature"></span>
```

and at the end of the scenario title:
```html
<span class="bdd-badge-scenario" data-feature="Name of feature" data-scenario="Scenario name"></span>
```

The Bdd Techdocs addon will detect these tags and replaces them with a badge to show the current status of the test, using the latest Azure Devops test result. 

The techdocs / mkdocs CLI will then include them in the documentation.

## Latest build
You can also add a tag to show the status of the latest build. That helps see when badges are not available because of a missing or unsuccessful build.
```html
<span class="bdd-badge-latestbuild"></span>
```
