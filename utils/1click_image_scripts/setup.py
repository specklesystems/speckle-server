#!/usr/bin/env python3

LOGO_STR = """
 _____                 _    _      _____
/  ___|               | |  | |    /  ___|
\ `--. _ __   ___  ___| | _| | ___\ `--.  ___ _ ____   _____ _ __
 `--. \ '_ \ / _ \/ __| |/ / |/ _ \`--. \/ _ \ '__\ \ / / _ \ '__|
/\__/ / |_) |  __/ (__|   <| |  __/\__/ /  __/ |   \ V /  __/ |
\____/| .__/ \___|\___|_|\_\_|\___\____/ \___|_|    \_/ \___|_|
      | |
      |_|
"""


def main():
    print(LOGO_STR)
    print(
        "\nAs of March 2024, Speckle server DigitalOcean 1-click setup script is no longer supported."
    )
    print(
        "\nPlease use the official Speckle Server installation guide to install Speckle Server on your own infrastructure."
    )
    print(
        "\nThis could be on a DigitalOcean Droplet that you have created yourself using an Ubuntu image."
    )
    print(
        "\nOur documentation can be found at https://speckle.guide/dev/server-manualsetup.html"
    )
    print(
        "\nIf you require to view previous versions of the 1-click setup script, please review the history of the speckle-server repository on GitHub."
    )
    print("\nHappy Speckling!")


if __name__ == "__main__":
    main()
