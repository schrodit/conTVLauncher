use std;
use std::thread;
use std::str::{self, FromStr};

use std::io::{self, Write};

use futures::Future;
use futures::stream::Stream;

use hyper::{self, Client};
use tokio_core;

use metadata::{Track, Album, Artist};
use session::Session;

#[derive(Serialize, Deserialize)]
struct sArtist {
    id: String,
    name: String
}

#[derive(Debug, Clone)]
pub struct Httpplayer {
    url: String
}

impl Httpplayer {
    pub fn new() -> Self {
        Httpplayer {
            url: String::from("http://127.0.0.1:33003?t=")
        }
    }
    pub fn send(&self, session: Session, track: Track) -> () {

        let album = session.metadata().get::<Album>(track.album).wait().unwrap();
        let mut covers: Vec<String> = Vec::new();
        for cover in album.covers {
            covers.push(cover.to_base16());
        }
        let mut artists: Vec<sArtist> = Vec::new();
        for id in track.artists {
            let artist = session.metadata().get::<Artist>(id).wait().unwrap();
            let sartist = sArtist {
                id: artist.id.to_base16(),
                name: artist.name
            };
            artists.push(sartist);
        }

        let res = json!({
            "id": &track.id.to_base16(),
            "name": &track.name,
            "available": &track.available,
            "album": {
                    "id": &album.id.to_base16(),
                    "name": &album.name,
                    "cover": covers,
            },
            "artists": artists,
        });

        let self_clone = self.clone();
        thread::spawn(move || {
            self_clone.sendJson(res.to_string());
            println!("thread finished");
        });
    }

    fn sendJson(&self, json: String) -> () {
        let mut paramurl = json;
        paramurl = paramurl.replace("{", "%7B");
        paramurl = paramurl.replace("}", "%7D");
        paramurl = paramurl.replace("\"", "%22");
        paramurl = paramurl.replace(":", "%3A");
        paramurl = paramurl.replace(";", "%3B");
        paramurl = paramurl.replace("[", "%5B");
        paramurl = paramurl.replace("]", "%5D");
        paramurl = paramurl.replace("=", "%3D");
        paramurl = paramurl.replace("?", "%3F");
        paramurl = paramurl.replace(",", "%2C");
        paramurl = paramurl.replace("/", "%2F");
        paramurl = paramurl.replace("#", "%23");
        paramurl = paramurl.replace("ä", "ae");
        paramurl = paramurl.replace("ö", "oe");
        paramurl = paramurl.replace("ü", "ue");
        paramurl = paramurl.replace("ß", "%C3%9F%0D%0A");
        paramurl = paramurl.replace("&", "%26");
        paramurl = paramurl.replace(" ", "%20");

        paramurl = self.url.clone() + &paramurl;

        let url = paramurl.parse::<hyper::Uri>().unwrap();
        if url.scheme() != Some("http") {
            println!("This example only works with 'http' URLs.");
            return;
        }

        println!("Url: {}", url);


        let mut core = tokio_core::reactor::Core::new().unwrap();
        let handle = core.handle();
        let client = Client::new(&handle);

        let work = client.get(url).and_then(|res| {
            println!("Response: {}", res.status());

            res.body().for_each(|chunk| {
                io::stdout().write_all(&chunk).map_err(From::from)
            })
        }).map(|_| {
            println!("\n\nDone.");
        });

        core.run(work).unwrap();
    }

}