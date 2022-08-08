# Speckle Contribution Guidelines

## Introduction

Thank you for reading this! Speckle's a rather wide network of parts that depend on each other, either directly, indirectly or even just cosmetically.

> **Speckle** is a quite large ecosystem of moving parts. Any changes may have unintended effects, that can cause problems quickly for many people (and processes) that rely on Speckle.

This means that what might look like a simple quick change in one repo may have a big hidden cost that propagates around other parts of the project. We're all here to help each other, and this guide is meant to help you get started and promote a framework that can untangle all these dependecies through discussion!

## Bugs & Issues 🐞

### Found a new bug?

- First step is to check whether this is a new bug! We encourage you to search through the issues of the project in question **and** associated repos!

- If you come up with nothing, **open a new issue with a clear title and description**, as much relevant information as possible: system configuration, code samples & steps to reproduce the problem.

- Can't mention this often enough: tells us how to reproduce the problem! We will ignore or flag as such issues without reproduction steps.

- Try to reference & note all potentially affected projects.

### Sending a PR for Bug Fixes

You fixed something! Great! We hope you logged it first :) Make sure though that you've covered the lateral thinking needed for a bug report, as described above, also in your implementation! If there any tests, make sure they all pass. If there are none, it means they're missing - so add them!

## New Features 🎉

The golden rule is to Discuss First!

- Before embarking on adding a new feature, suggest it first as an issue with the `enhancement` label and/or title - this will allow relevant people to pitch in
- We'll now discuss your requirements and see how and if they fit within the Speckle ecosystem.
- The last step is to actually start writing code & submit a PR so we can follow along!
- All new features should, if and where possible, come with tests. We won't merge without!

> Many clients may potentially have overlapping scopes, some features might already be in dev somewhere else, or might have been postponed to the next major release due to api instability in that area. For example, adding a delete stream button in the accounts panel in rhino: this feature was planned for speckle admin, and the whole functionality of the accounts panel in rhino is to be greatly reduced!

## Cosmetic Patches ✨

Changes that are cosmetic in nature and do not add anything substantial to the stability or functionality of Speckle **will generally not be accepted**.

Why? However trivial the changes might seem, there might be subtle reasons for the original code to be as it is. Furthermore, there are a lot of potential hidden costs (that even maintainers themselves are not aware of fully!) and they eat up review time unncessarily.

> **Examples**: modifying the colour of an UI element in one client may have a big hidden cost and need propagation in several other clients that implement a similar ui element. Changing the default port or specifiying `localhost` instead of `0.0.0.0` breaks cross-vm debugging and developing.

## Wrap up

Don't worry if you get things wrong. We all do, including project owners: this document should've been here a long time ago. There's plenty of room for discussion on our community [forum](https://discourse.speckle.works).

🙌❤️💙💚💜🙌
