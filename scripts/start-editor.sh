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

if [[ ! -d node_modules ]]; then
    echo "Error: dependencies are not installed. Run ./scripts/build.sh once first." >&2
    exit 1
fi

run_step() {
    printf '\n==> %s\n' "$*"
    "$@"
}

trap 'printf "\nQuick start failed at shell line %s.\n" "$LINENO" >&2' ERR

run_step "${yarn_command[@]}" assets
run_step "${yarn_command[@]}" fonts
run_step "${yarn_command[@]}" download:plugins
run_step "${yarn_command[@]}" build:extensions
run_step "${yarn_command[@]}" build:application

printf '\nStarting INTERLIS Editor.\n'

editor_arguments=("$@")
if [[ ${#editor_arguments[@]} -eq 1 && -f ${editor_arguments[0]} ]]; then
    file_uri="$(node -e '
        const path = require("node:path");
        const { pathToFileURL } = require("node:url");
        process.stdout.write(pathToFileURL(path.resolve(process.argv[1])).href);
    ' "${editor_arguments[0]}")"
    editor_arguments=(--open-url "$file_uri")
fi

exec "${yarn_command[@]}" workspace interlis-editor-electron-app start "${editor_arguments[@]}"
