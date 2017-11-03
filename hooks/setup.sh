#!/usr/bin/env bash
# Sets up git hooks

function git_is_installed {
  command -v git >/dev/null 2>&1
}
function is_git_repo {
  git_is_installed && git status >/dev/null 2>&1
}
function is_sdk_repo {
  if is_git_repo; then
    local REPO=`git rev-parse --show-toplevel`
    cd $REPO
    [ "$(basename $REPO)" == "open-registry-sdk" ]
  else 
    false
  fi
}

if is_sdk_repo; then
  echo "Setting up custom hook path"
  git config core.hooksPath 'hooks/'
fi
