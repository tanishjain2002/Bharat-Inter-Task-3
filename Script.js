let client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let config = {
  appid: "69c1e63780f1422ba8bc647440a72132",
  token:
    "007eJxTYGCcHGq8y+yu6eqcnOXvSj85G2xYd2nfjuYOhTczt4arKk1XYDCzTDZMNTM2tzBIMzQxMkpKtEhKNjMxNzExSDQ3MjQ2yuaOTGkIZGQw+fGbiZEBAkF8LoaczLLU4pKi1MRcBgYAHfch0w==",
  uid: null,
  channel: "livestream",
};

let localTracks = {
  audioTrack: null,
  videoTrack: null,
};

let localTrackState = {
  audioTrackMuted: false,
  videoTrackMuted: false,
};

let remoteTracks = {};

document.getElementById("join-btn").addEventListener("click", async () => {
  config.uid = document.getElementById("username").value;
  await joinStreams();
  document.getElementById("join-wrapper").style.display = "none";
  document.getElementById("footer").style.display = "flex";
});

document.getElementById("mic-btn").addEventListener("click", async () => {
  if (!localTrackState.audioTrackMuted) {
    //Mute your audio
    await localTracks.audioTrack.setMuted(true);
    localTrackState.audioTrackMuted = true;
    document.getElementById("mic-btn").style.backgroundColor = "#B0DAFF";
  } else {
    await localTracks.audioTrack.setMuted(false);
    localTrackState.audioTrackMuted = false;
    document.getElementById("mic-btn").style.backgroundColor = "#1f1f1f8e";
  }
});

document.getElementById("camera-btn").addEventListener("click", async () => {
  if (!localTrackState.videoTrackMuted) {
    await localTracks.videoTrack.setMuted(true);
    localTrackState.videoTrackMuted = true;
    document.getElementById("camera-btn").style.backgroundColor = "#B0DAFF";
  } else {
    await localTracks.videoTrack.setMuted(false);
    localTrackState.videoTrackMuted = false;
    document.getElementById("camera-btn").style.backgroundColor = "#B0DAFF";
  }
});

document.getElementById("leave-btn").addEventListener("click", async () => {
  for (trackName in localTracks) {
    let track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = null;
    }
  }

  await client.leave();
  document.getElementById("footer").style.display = "none";
  document.getElementById("user-streams").innerHTML = "";
  document.getElementById("join-wrapper").style.display = "block";
});

let joinStreams = async () => {
  client.on("user-published", handleUserJoined);
  client.on("user-left", handleUserLeft);

  client.enableAudioVolumeIndicator();
  client.on("volume-indicator", function (evt) {
    for (let i = 0; evt.length > i; i++) {
      let speaker = evt[i].uid;
      let volume = evt[i].level;
      if (volume > 0) {
        document.getElementById(`volume-${speaker}`).src = "von.svg";
      } else {
        document.getElementById(`volume-${speaker}`).src = "voff.svg";
      }
    }
  });

  [config.uid, localTracks.audioTrack, localTracks.videoTrack] =
    await Promise.all([
      client.join(
        config.appid,
        config.channel,
        config.token || null,
        config.uid || null
      ),
      AgoraRTC.createMicrophoneAudioTrack(),
      AgoraRTC.createCameraVideoTrack(),
    ]);

  let player = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${config.uid}" src="./assets/volume-on.svg" /> ${config.uid}</p>
                        <div class="video-player player" id="stream-${config.uid}"></div>
                  </div>`;

  document
    .getElementById("user-streams")
    .insertAdjacentHTML("beforeend", player);

  localTracks.videoTrack.play(`stream-${config.uid}`);

  await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
};

let handleUserJoined = async (user, mediaType) => {
  console.log("Handle user joined");

  remoteTracks[user.uid] = user;

  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    let player = document.getElementById(`video-wrapper-${user.uid}`);
    console.log("player:", player);
    if (player != null) {
      player.remove();
    }

    player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                      </div>`;
    document
      .getElementById("user-streams")
      .insertAdjacentHTML("beforeend", player);
    user.videoTrack.play(`stream-${user.uid}`);
  }

  if (mediaType === "audio") {
    user.audioTrack.play();
  }
};

let handleUserLeft = (user) => {
  console.log("Handle user left!");

  delete remoteTracks[user.uid];
  document.getElementById(`video-wrapper-${user.uid}`).remove();
};
