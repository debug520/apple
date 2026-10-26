set -eu
mkdir -p dist
for archive in assets-*.zip; do unzip -qo "$archive" -d dist; done
cp dist/travel.html dist/index.html
mkdir -p dist/travel
sed 's@<head>@<head><base href="/">@' dist/index.html > dist/travel/index.html
