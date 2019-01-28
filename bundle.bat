cd scraper
:: yarn clean & :: Clear cache.html and re-download from soundgasm
CALL yarn start

cd ../viewer
CALL yarn
CALL python templater.py
CALL yarn build
CALL python slimmer.py

cd ..

CALL cp viewer/dist/index.html .
