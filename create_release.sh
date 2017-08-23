#! /bin/bash

mkdir release
cp -r installation release/
cp -r bin release/
cp -r conTVLauncher-linux-64x release/
tar -czvf conTVLauncher-linux-x64.tar.gz release/*
rm -r release


mkdir release
cp -r install release/
cp -r bin release/
cp -r conTVLauncher-linux-armv7l release/
tar -czvf conTVLauncher-linux-armv7l.tar.gz release/*