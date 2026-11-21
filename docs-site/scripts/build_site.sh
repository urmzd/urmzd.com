#!/usr/bin/env bash
# Assemble docs.urmzd.com: the landing page from public/ plus each project
# guide built from its own repository's main branch.
#
# Usage: scripts/build_site.sh [out_dir]
# BOOKS_DIR may point at existing checkouts named after each project;
# otherwise each book is cloned into a temporary directory.
set -euo pipefail

# Humagen and O4VE publish their own guides at docs.withhumagen.com and
# docs.o4ve.com. Stubs in public/humagen/ and public/404.html redirect
# Humagen's old addresses there.
BOOKS=(saige orchagent)
root=$(cd "$(dirname "$0")/.." && pwd)
out=${1:-"$root/_site"}
books_dir=${BOOKS_DIR:-$(mktemp -d)}

rm -rf "$out"
cp -R "$root/public" "$out"

versions="{"
for book in "${BOOKS[@]}"; do
  src="$books_dir/$book"
  if [ ! -d "$src" ]; then
    git clone --quiet --depth 1 "https://github.com/urmzd/$book.git" "$src"
  fi
  (cd "$src" && zensical build --strict --clean)
  cp -R "$src/site" "$out/$book"
  sha=$(git -C "$src" rev-parse HEAD)
  versions+="\"$book\":\"$sha\","
  echo "Built $book at $sha"
done
echo "${versions%,}}" > "$out/versions.json"
