#!/usr/bin/env bash
set -eox pipefail

# Update to take effect sources repository database
sudo apt-get update

# Make the cache dir if it doesn't exist
if ! [[ -d vendor/apt ]]; then
    mkdir -p vendor/apt
fi

whoami

# Making sure our user has ownership, in order to cache
sudo chown -R root:root vendor/apt

# if pip is not already installed, checking the version will return a non-zero exit code and then we will install it
python3 -m pip --version || {
    # First check for archives cache
    if ! [[ -d vendor/apt/archives ]]; then
        export DEBIAN_FRONTEND=noninteractive

        # It doesn't so download the packages
        sudo apt-get -y install  --no-install-recommends --download-only python3-pip=22.0.2+dfsg-1
        # Then move them to our cache directory
        sudo cp -R /var/cache/apt vendor/
    fi

    # Install all packages in the cache
    sudo dpkg -i vendor/apt/archives/*.deb
}

# if pre-commit is not already installed, checking the version will return a non-zero exit code and then we will install it
pre-commit --version || {
    python3 -m pip install --progress-bar=off pre-commit
}
