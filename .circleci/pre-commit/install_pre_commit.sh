#!/usr/bin/env bash
set -eox pipefail

# if pip is not already installed, checking the version will return a non-zero exit code and then we will install it
python3 -m pip --version || {
    # Make the cache dir if it doesn't exist
    if ! [[ -d vendor/apt ]]; then
        mkdir -p /tmp/vendor/apt
    fi

    # Making sure our user has ownership, in order to cache
    sudo chown -R circleci:circleci /tmp/vendor/apt

    # First check for archives cache
    if ! [[ -d /tmp/vendor/apt/archives ]]; then
        export DEBIAN_FRONTEND=noninteractive

        # Update to take effect sources repository database
        sudo apt-get -q update

        # It doesn't so download the packages
        sudo apt-get -y install --no-install-recommends --download-only python3-pip=20.0.2-5ubuntu1.6
        # Then move the downloaded packages to our cache directory
        sudo cp -R /var/cache/apt /tmp/vendor/
        sudo chmod -R 777 /tmp/vendor/apt
    fi

    # Install all packages in the cache
    sudo dpkg -i /tmp/vendor/apt/archives/*.deb
}

# if pre-commit is not already installed, checking the version will return a non-zero exit code and then we will install it
pre-commit --version || {
    python3 -m pip install --progress-bar=off pre-commit
}

mkdir -p /tmp/.eslintcache/
