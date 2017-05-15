#! /bin/bash

mkdir build
cp -r install build/
cp -r bin build/
cp -r conTVLauncher-linux-64x build/
tar -czvf conTVLauncher-linux-x64.tar.gz build/*
rm -r build


mkdir build
cp -r install build/
cp -r bin build/
cp -r conTVLauncher-linux-armv7l build/
tar -czvf conTVLauncher-linux-armv7l.tar.gz build/*