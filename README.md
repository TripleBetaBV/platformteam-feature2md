# Gherkin to markdown converter

Utility designed to run in the build pipeline of techdocs.
It finds all the .feature files in the current path and subdirectories and
creates a markdown representation.

## Usage

Execute the script in a directory that contains .feature files:

```bash
node feature2markdown.js
```

To run the tests, in the root directory of the repo:

```bash
npm test
```


## How does it work?

Each .feature file will get its corresponding .feature.md file next to it.
It will also detect any reference to a .feature file in any of the markdown files
and will replace it with a reference to its corresponding .feature.md file.

It will add a special tags around the title of each feature or scenario title:
```html
<span class="bdd-badge-feature" data-feature="Name of feature">Feature: My feature</span>
```

and at the end of the scenario title:
```html
<span class="bdd-badge-scenario" data-feature="Name of feature" data-scenario="Scenario name">My Scenario</span>
```

The Bdd Badges Addon for Techdocs will process these tags when it renders the document:
1. Identify the the Backstage Entity that belongs to this documentation
2. Retrieve the source location of the entity
3. Find the Azure Devops pipeline that runs the BDD tests
4. Parse the test results to get the result for each scenario
5. Derive the status of the feature from the status of the underlying features

Once it has all the information, it will add an extra attribute to it to indicate the latest test result for that scenario or feature.

```html
<span class="bdd-badge-feature" data-feature="Name of feature" data-result="passed">Feature: My feature</span>
```

The final part is done by one of the CSS files in the styles folder, which is included as inline CSS for each generated.md file . Its content is added at the beginning of each generated file. The styles define how to render the feature or scenario title based on its status.

The default style will append a badge at the end of each test but you can customize the behavior in the stylesheet.

The techdocs / MkDocs CLI will then include them in the documentation.

## Latest build

You can also add a tag to show the status of the latest build. That helps see when badges are not available because of a missing or unsuccessful build.

```html
<span class="bdd-badge-latestbuild"></span>
```
