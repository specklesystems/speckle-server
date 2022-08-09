# Publishing and Releasing

## Publishing Images

Images are published based on the logic in [should_publish.sh](./should_publish.sh), and the regex provided in `PUBLISHABLE_TAGS` and `PUBLISHABLE_BRANCHES` environment variables in the CircleCI [config](./config.yml).

Currently images are published in the following conditions:

- any commit to branches named `main`, `hotfix.*`, or `alpha.*`
- any branch tagged with [semver](https://semver.org/) `major.minor.patch` (regex: `^[0-9]+\.[0-9]+\.[0-9]+$`)

## Creating a release

The easiest way to create a new release is to [Create a New Release](https://github.com/specklesystems/speckle-server/releases/new) on Github, and in the 'Select A Tag' dropdown create a new tag with the appropriate [semver](https://semver.org/) increment.

Ideally the target branch should be `main`.
