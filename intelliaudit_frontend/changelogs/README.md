# IntelliAudit Changelogs

This directory contains changelog files for various features and components of the IntelliAudit application.

## How to Use This Directory

- Each feature or major component should have its own changelog file
- Use the [Keep a Changelog](https://keepachangelog.com/) format
- Name files using kebab-case, e.g., `feature-name.md`
- Include unreleased changes at the top of each file
- Move unreleased changes to a dated release section when deployed

## Current Changelog Files

- [Report Integration](./report-integration.md) - Implementation of the energy audit report feature

## Project Rules

Project-specific rules and guidelines should be included in each changelog. This ensures that developers working on a feature understand the conventions and patterns to follow.

## Updating Changelogs

When making changes to the codebase:

1. Identify the appropriate changelog file
2. Add your changes under the "Unreleased" section
3. Categorize your changes as:
   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for any bug fixes
   - `Security` for vulnerability fixes
4. Include a brief description of what was changed and why

Example:
```md
### Added
- Added new feature X that does Y
```

Changelogs help maintain a clear history of changes and make it easier for team members to understand what's happening in the project. 