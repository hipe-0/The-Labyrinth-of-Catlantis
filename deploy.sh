#!/bin/bash

# Build the project
npm run build

# Create a temporary directory
mkdir temp-deploy

# Copy the build files to the temporary directory
cp -r build/* temp-deploy/

# Create a new git repository in the temporary directory
cd temp-deploy
git init
git add .
git commit -m "Deploy to GitHub Pages"

# Force push to the gh-pages branch
git push -f git@github.com:hipe-0/The-Labyrinth-of-Catlantis.git main:gh-pages

# Clean up
cd ..
rm -rf temp-deploy 