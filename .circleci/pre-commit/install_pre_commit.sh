#!/usr/bin/env bash
set -eo pipefail


sudo mv /etc/apt/sources.list.d /etc/apt/sources.list.d.save
udo mkdir /etc/apt/sources.list.d

# Copy the repository list from source tree to replace default
sudo cp sources.list /etc/apt/sources.list
# Update to take effect sources repository database
sudo apt-get update

# Make the cache dir if it doesn't exist
if ! [[ -d vendor/apt ]]; then
    mkdir -p vendor/apt
fi

# Making sure our user has ownership, in order to cache
sudo chown -R ubuntu:ubuntu vendor/apt

# if pip is not already installed, checking the version will return a non-zero exit code and then we will install it
python3 -m pip --version || {
    # First check for archives cache
    if ! [[ -d vendor/apt/archives ]]; then
        export DEBIAN_FRONTEND=noninteractive

        # It doesn't so download the packages
        sudo apt-get -y install  --no-install-recommends --download-only python3-pip
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
