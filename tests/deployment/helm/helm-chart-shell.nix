{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/63dacb46bf939521bdc93981b4cbb7ecb58427a0.tar.gz") {} }:

let
  corepack = pkgs.stdenv.mkDerivation {
    name = "corepack";
    buildInputs = [ pkgs.nodejs_22 ];
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
    pkgs.nodejs_22
    pkgs.ctlptl
    pkgs.crane
    pkgs.kubernetes-helm
    pkgs.tilt
    corepack
  ];
}
