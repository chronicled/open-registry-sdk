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
function is_sdk_repo_with_no_hooks {
  is_sdk_repo && [ ! -L .git/hooks/pre-commit ]
}

if is_sdk_repo_with_no_hooks; then
  echo "Setting up pre-commit hooks"
  ln -si ../../hooks/pre-commit.sh .git/hooks/pre-commit
fi
