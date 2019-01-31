#!/bin/sh

cd scraper
yarn clean # Clear cache and re-download from soundgasm
yarn start

cd ../viewer
yarn
./templater.py
yarn build
./slimmer.py

cd ../

cp viewer/dist/index.html .

if [ -f scraper/.new_audio ]; then
  echo "New audio found, publishing..."
  rm scraper/.new_audio
  ./publish.sh
else
  echo "No new audios found."
fi