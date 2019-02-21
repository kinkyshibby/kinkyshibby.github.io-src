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
  echo "$(date) : Found new audio!" >> log.txt
  rm scraper/.new_audio
  ./publish.sh
else
  echo "$(date) : No new audios found." >> log.txt
fi
