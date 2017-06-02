## Integrate extension to librespot

1. Copy httpplayer.rs to src/httpplayer.rs

2. Add `pub mod http_player;` to src/lib.rs

3. add 
    ```rust
    let tTrack = track.clone();
    Httpplayer::new().send(self.session.clone(), tTrack.into_owned());
    ```

to the end of `fn load_track(&self, track_id: SpotifyId, position: i64) -> Option<Decoder>` function inside src/player.rs

4. add 
    ```rust
    Httpplayer::new().sendStatus("[play|pause|stop|seek]".to_string(), position as i64);
    ```
    to 
    ```rust
    match self.load_track(track_id, position as i64) {
        Some(decoder) => {
            if play {
                if !self.state.is_playing() {
                    self.run_onstart();
                }
                self.sink.start().unwrap();

                self.state = PlayerState::Playing {
                    decoder: decoder,
                    end_of_track: end_of_track,
                };
                Httpplayer::new().sendStatus("play".to_string(), position as i64);
            } else {
                if self.state.is_playing() {
                    self.run_onstop();
                }

                self.state = PlayerState::Paused {
                    decoder: decoder,
                    end_of_track: end_of_track,
                };
                Httpplayer::new().sendStatus("pause".to_string(), position as i64);
            }
        }
    ```
        and

    ```rust
    PlayerCommand::Seek(position) => {
        if let Some(decoder) = self.state.decoder() {
            match vorbis_time_seek_ms(decoder, position as i64) {
                Ok(_) => Httpplayer::new().sendStatus("seek".to_string(), position as i64),
                Err(err) => error!("Vorbis error: {:?}", err),
            }
        } else {
            warn!("Player::seek called from invalid state");
        }
    }

    PlayerCommand::Play => {
        if let PlayerState::Paused { .. } = self.state {
            self.state.paused_to_playing();

            self.run_onstart();
            self.sink.start().unwrap();
            Httpplayer::new().sendStatus("play".to_string(), -1);
        } else {
            warn!("Player::play called from invalid state");
        }
    }

    PlayerCommand::Pause => {
        if let PlayerState::Playing { .. } = self.state {
            self.state.playing_to_paused();

            self.sink.stop().unwrap();
            self.run_onstop();
            Httpplayer::new().sendStatus("pause".to_string(), -1);
        } else {
            warn!("Player::pause called from invalid state");
        }
    }

    PlayerCommand::Stop => {
        Httpplayer::new().sendStatus("stop".to_string(), -1);
        match self.state {
            PlayerState::Playing { .. } => {
                self.sink.stop().unwrap();
                self.run_onstop();
                self.state = PlayerState::Stopped;
            }
            PlayerState::Paused { .. } => {
                self.state = PlayerState::Stopped;
            },
            PlayerState::Stopped => {
                warn!("Player::stop called from invalid state");
            }
            PlayerState::Invalid => panic!("invalid state"),
        }
    }
    ```
