{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/5b7cd5c39befee629be284970415b6eb3b0ff000.tar.gz") {} }:

let
  corepack = pkgs.stdenv.mkDerivation {
    name = "corepack";
    buildInputs = [ pkgs.nodejs-18_x ];
    phases = [ "installPhase" ];
    installPhase = ''
      mkdir -p $out/bin
      corepack enable --install-directory=$out/bin
    '';
  };
in pkgs.mkShell {
  buildInputs = [
    pkgs.docker
    pkgs.kind
    pkgs.kubectl
    pkgs.nodejs-18_x
    pkgs.ctlptl
    pkgs.crane
    pkgs.kubernetes-helm
    pkgs.tilt
    corepack
  ];
}
