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
  ./publish.sh && rm scraper/.new_audio
  notify-send -u normal -t 1000 "Sbby" "New audio."
else
  echo "$(date) : No new audios found." >> log.txt
  notify-send -u normal -t 5000 "Sbby" "No new audio."
fi
