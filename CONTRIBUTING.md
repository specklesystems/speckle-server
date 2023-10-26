# Speckle Contribution Guidelines

## Introduction

Thank you for reading this! At Speckle, we're part of a vast interconnected network of components, each relying on the others, whether directly, indirectly, or even aesthetically.

> **Speckle**'s ecosystem is expansive, consisting of many moving parts. Changes made within it can have unforeseen consequences, potentially causing disruptions for many users and processes. It's essential to understand that what seems like a simple alteration in one part of our project can have significant implications throughout the system.

We're all here to support one another, and these guidelines are designed to assist you in getting started and promoting discussions to unravel complexities within our dependencies. Your contributions are highly valued, and following these guidelines ensures a smooth and collaborative experience for everyone.

## Bugs & Issues 🐞

### Found a New Bug?

- Before reporting a new bug, search existing issues to avoid duplicates.
- If it's a **new issue, create one with a clear title and description** as relevant information as possible:
  - System configuration
  - Code samples
  - Steps to reproduce the problem
- Reproduction steps are essential; issues without them may be ignored.

### Security Vulnerabilities

For security vulnerabilities or concerns, contact us directly at security[at]speckle.systems.

### Sending a PR for Bug Fixes

- If you fixed a bug, ensure you've followed the bug report process.
- Verify that all existing tests pass.
- If there are no tests, please add them.

## New Features 🎉

### The Golden Rule: Discuss First!

- Before developing a new feature, start a discussion by creating an issue with the `enhancement` label.
- This allows others to provide feedback and determine if the feature aligns with Speckle's goals.

### Development Steps

1. Discuss your requirements and get feedback.
2. Start writing code and submit a PR.
3. Include tests with your new feature.

## Cosmetic Patches ✨

Cosmetic changes that do not enhance stability or functionality are generally not accepted.

- Even seemingly minor changes may have unforeseen consequences.
- Hidden costs can consume review time unnecessarily.

> **Examples**:
>
> - Changing UI element colors in one client may affect others.
> - Changing the default port or specifying `localhost` instead of `0.0.0.0` breaks cross-vm debugging and developing.

## Wrap Up

Don't worry if you make mistakes; we all do. There's room for discussion on our community [forum](https://speckle.community/).

🙌 Thank you for your contributions! 🙌
