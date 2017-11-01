
#!/usr/bin/env bash

echo "Running pre-commit checks"
npm run lint || { echo 'NPM lint failed, please resolve errors' >&2; exit 1; }
npm run test || { echo 'NPM test failed, please resolve errors' >&2; exit 1; }

function package_changes_staged {
 ! git diff --cached --quiet -- package.json
}
function shrinkwrap_changes_notstaged {
  git diff --cached --quiet -- npm-shrinkwrap.json
}
# We make sure that the shrinkwrap file is updated whenver a change to the package.json
# file is commited and run shrinkwrap automatically if not
if package_changes_staged && shrinkwrap_changes_notstaged; then
  echo "Running 'npm shrinkwrap' to match new package spec..."
  npm prune || { echo 'NPM prune failed, please resolve error' >&2; exit 1; }
  npm shrinkwrap || { echo 'NPM shrinkwrap failed, please resolve error' >&2; exit 1; }
  git add npm-shrinkwrap.json
fi

