#!bin/bash

sudo apt-get install build-essential portaudio19-dev
curl https://sh.rustup.rs -sSf | sh
source $HOME/.cargo/env

git clone https://github.com/plietar/librespot.git
cargo build --release

mkdir /bin/spotify
mkdir /bin/spotify/cache
cp librespot/target/release/* /bin/spotify
rm -r librespot