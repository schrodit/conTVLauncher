# conTVLauncher [![build status](https://gitlab.com/schrodit/conTVLauncher/badges/master/build.svg)](https://gitlab.com/schrodit/conTVLauncher/commits/master)

Mainly build with https://electron.atom.io/ and https://www.polymer-project.org/ in Frontend.

## Installation

Download latest conTVLauncher-linux-armvl or conTVLauncher-linux-x64

Execute `` ./conTVLauncher ``

To add cutom tiles add new entry to $HOME/.config/conTVLauncher/config.json:
```json
{
  "type": ["web"|"shell"],
  "img": "path/to/image",
  "url" : "URL" //for web type,
  "cmd" : "Command like kodi" // for shell type ,
  "show": Boolean
}
```

Kodi needs to be installed and enabled in the $HOME/.config/conTVLauncher/config.json

Testet on Arch, Debian and Raspbian.

## About
Icons made by <a href="http://www.flaticon.com/authors/madebyoliver" title="Madebyoliver">Madebyoliver</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>



## Licence
https://github.com/sp-convey/conTVLauncher/blob/master/LICENSE
