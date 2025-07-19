{
  description = "Aipacto Monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
         buildInputs = [
            pkgs.nodejs_24
            pkgs.typescript
            pkgs.yarn-berry
            pkgs.git
            pkgs.gh
            pkgs.starship # shell beautifier
          ];


          shellHook = ''
            echo "🚀 Aipacto Monorepo"
            echo "Node.js $(node --version)"
            echo "TypeScript $(tsc --version)"
            echo "Yarn $(yarn --version)"
            echo ""

            # Initialize Starship prompt for this Bash shell
            eval "$(starship init bash)"
          '';

          # Set environment variables
          NODE_ENV = "development";
        };
      });
}
