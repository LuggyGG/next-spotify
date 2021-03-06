import { NextPage, GetServerSidePropsContext } from "next";
import useSpotifyPlayer from "../hooks/useSpotifyPlayer";
import Cookies from "cookies";
import useSWR from "swr";
import { Layout } from "../components/Layout";
import PlaylistsCollection from "../components/playlists";
//import CategoryList from "../components/categories";
import React, { useState } from "react";
import { SpotifyState, SpotifyUser } from "../types/spotify";
import FormSearch from "../components/search";

interface Props {
  user: SpotifyUser;
  accessToken: string;
}
const play = (accessToken: string, deviceId: string) => {
  return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      uris: ["spotify:track:1lCRw5FEZ1gPDNPzy1K4zW"],
    }),
  });
};
const pause = (accessToken: string, deviceId: string) => {
  return fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
const Player: NextPage<Props> = ({ accessToken }) => {
  const { data, error } = useSWR("/api/get-user-info");
  const [paused, setPaused] = React.useState(false);
  const [currentTrack, setCurrentTrack] = React.useState("");
  const [deviceId, player] = useSpotifyPlayer(accessToken);
  const [page, setPage] = useState("search");

  React.useEffect(() => {
    const playerStateChanged = (state: SpotifyState) => {
      setPaused(state.paused);
      setCurrentTrack(state.track_window.current_track.name);
    };
    if (player) {
      player.addListener("player_state_changed", playerStateChanged);
    }
    return () => {
      if (player) {
        player.removeListener("player_state_changed", playerStateChanged);
      }
    };
  }, [player]);
  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;
  const user = data;
  return (
    <Layout isLoggedIn={true}>
      <div className="player">
        <h1>Player</h1>
        <p>Welcome {user && user.display_name}</p>
        <p>{currentTrack}</p>
        <button
          onClick={() => {
            paused ? play(accessToken, deviceId) : pause(accessToken, deviceId);
          }}
        >
          {paused ? "play" : "pause"}
        </button>
      </div>
      <div>
        {/* {page === "home" && <Home />} */}
        {page === "search" && <FormSearch accessToken={accessToken} />}
      </div>
      ???<h3>Going to Drum And Bass</h3>
      <PlaylistsCollection playlistStyle={"dnb"} />???<h3>Forge some Metal</h3>
      <PlaylistsCollection playlistStyle={"metal"} />???<h3>Destroy in Electro</h3>
      <PlaylistsCollection playlistStyle={"electro"} />???<h3>Chill out with Reggae</h3>
      <PlaylistsCollection playlistStyle={"reggae"} />???<h3>Up to be Happy</h3>
      <PlaylistsCollection playlistStyle={"happy"} />
    </Layout>
  );
};
export default Player;
export const getServerSideProps = async (context: GetServerSidePropsContext): Promise<unknown> => {
  const cookies = new Cookies(context.req, context.res);
  const accessToken = cookies.get("spot-next");
  if (accessToken) {
    return { props: { accessToken } };
  } else {
    return {
      props: {},
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }
};
