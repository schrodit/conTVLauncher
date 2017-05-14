#!/bin/bash
# Install Whatsapp

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#sh install_spotify.sh
#electron-packager ./ conTVLauncher --platform=linux --arch=x64

sudo mkdir -p /usr/share/conTVLauncher

sudo cp  -R $DIR/conTVLauncher-linux-x64/* /usr/share/conTVLauncher/

# cp to bin
sudo cp $DIR/conTVLauncher /usr/bin/
sudo chmod +x /usr/bin/conTVLauncher

# cp desktop file
sudo cp $DIR/conTVLauncher.desktop /usr/share/applications/conTVLauncher.desktop
