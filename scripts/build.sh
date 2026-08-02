#!/usr/bin/env bash

set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
cd "$repo_root"

if command -v corepack >/dev/null 2>&1; then
    yarn_command=(corepack yarn)
else
    yarn_command=(yarn)
fi

if ! command -v "${yarn_command[0]}" >/dev/null 2>&1; then
    echo "Error: Yarn or Corepack is required." >&2
    exit 1
fi

run_step() {
    printf '\n==> %s\n' "$*"
    "$@"
}

trap 'printf "\nBuild failed at shell line %s.\n" "$LINENO" >&2' ERR

run_step "${yarn_command[@]}" install --non-interactive --network-timeout 600000
run_step "${yarn_command[@]}" verify
run_step "${yarn_command[@]}" assets
run_step "${yarn_command[@]}" fonts
run_step "${yarn_command[@]}" download:plugins
run_step "${yarn_command[@]}" verify:plugins
run_step "${yarn_command[@]}" build:extensions
run_step "${yarn_command[@]}" build:application
run_step "${yarn_command[@]}" test

case "$(uname -s)" in
    Linux)
        run_step "${yarn_command[@]}" package:preview
        ;;
    Darwin|MINGW*|MSYS*|CYGWIN*)
        run_step "${yarn_command[@]}" workspace interlis-editor-electron-app package
        ;;
    *)
        echo "Error: unsupported packaging platform $(uname -s)." >&2
        exit 1
        ;;
esac

printf '\nBuild completed successfully.\n'
