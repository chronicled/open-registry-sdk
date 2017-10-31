#!/usr/bin/env bash
# Sets up git hooks

REPO=`git rev-parse --show-toplevel`
cd $REPO

if [ ! -L .git/hooks/pre-commit ]; then
  echo "Setting up pre-commit hook"
  ln -si ../../hooks/pre-commit.sh .git/hooks/pre-commit
fi
