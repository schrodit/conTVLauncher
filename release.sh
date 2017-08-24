#! /bin/bash

mkdir release
cp -r installation release/
cp -r conTVLauncher-linux-x64 release/
tar -czvf conTVLauncher-linux-x64-$now.tar.gz release/*
rm -r release


# mkdir release
# cp -r install release/
# cp -r bin release/
# cp -r conTVLauncher-linux-armv7l release/
# tar -czvf conTVLauncher-linux-armv7l.tar.gz release/*