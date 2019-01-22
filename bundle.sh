#!/bin/sh

cd scraper
# yarn clean # Clear cache.html and re-download from soundgasm
yarn start

cd ../viewer
yarn
./templater.py
yarn build
./slimmer.py

cd ../

cp viewer/dist/index.html .