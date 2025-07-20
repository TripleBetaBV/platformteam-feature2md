# Gherkin to markdown converter

Utility designed to run in the build pipeline of techdocs.
It finds all the .feature files in the current path and subdirectories and
creates a markdown representation.

Each .feature file will get its corresponding .feature.md file next to it.
It will also detect any reference to a .feature file in any of the markdown files
and will replace it with a reference to its corresponding .feature.md file.

The techdocs / mkdocs CLI will then include them in the documentation.