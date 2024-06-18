{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/5b7cd5c39befee629be284970415b6eb3b0ff000.tar.gz") {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.docker
    pkgs.tilt
  ];
}
