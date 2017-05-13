#!/bin/bash
# Install Whatsapp

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

sh install_spotify.sh
electron-packager ./ conTVLauncher --platform=linux --arch=x64

mkdir -p /usr/share/conTVLauncher

cp  -R $DIR/conTVLauncher-linux-x64/* /usr/share/conTVLauncher/

# cp to bin
cp $DIR/conTVLauncher /usr/bin/
chmod +x /usr/bin/conTVLauncher

# cp desktop file
cp $DIR/conTVLauncher.desktop /usr/share/applications/conTVLauncher.desktop