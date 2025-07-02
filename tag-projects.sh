#!/bin/bash

VERSION="0.0.11"
PROJECTS=(
  "@nestledjs/forms"
  "@nestledjs/api"
  "@nestledjs/config"
  "@nestledjs/plugins"
  "@nestledjs/shared"
  "@nestledjs/utils"
  "@nestledjs/web"
)

for project in "${PROJECTS[@]}"; do
  TAG="${project}@${VERSION}"
  echo "Creating tag: $TAG"
  git tag "$TAG"
done
