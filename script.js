(() => {
  const localPlayer = document.getElementById("localPlayer");
  const fileInput = document.getElementById("fileInput");
  const playlistEl = document.getElementById("playlist");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const seekBar = document.getElementById("seekBar");
  const volumeBar = document.getElementById("volumeBar");

  let playlist = [];
  let currentIndex = -1;
  let userSeeking = false;

  // Format seconds into MM:SS
  const formatTime = (sec) => {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Load a track by index
  function loadTrack(index, play = false) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    localPlayer.src = playlist[index].url;
    localPlayer.load();
    updatePlaylistUI();
    if (play) localPlayer.play();
  }

  // Update playlist display
  function updatePlaylistUI() {
    playlistEl.innerHTML = "";
    playlist.forEach((track, idx) => {
      const li = document.createElement("li");
      li.textContent = track.file.name;
      li.className = idx === currentIndex ? "active" : "";
      li.addEventListener("click", () => loadTrack(idx, true));
      playlistEl.appendChild(li);
    });
  }

  // Play next/previous
  function playNext() {
    if (!playlist.length) return;
    loadTrack((currentIndex + 1) % playlist.length, true);
  }
  function playPrev() {
    if (!playlist.length) return;
    loadTrack((currentIndex - 1 + playlist.length) % playlist.length, true);
  }

  // Play/pause toggle
  function togglePlayPause() {
    if (localPlayer.paused) localPlayer.play();
    else localPlayer.pause();
  }

  // Update seek bar and time
  localPlayer.addEventListener("timeupdate", () => {
    if (!userSeeking) {
      const current = localPlayer.currentTime;
      const total = localPlayer.duration || 0;
      currentTimeEl.textContent = formatTime(current);
      durationEl.textContent = formatTime(total);
      seekBar.value = total ? (current / total) * 100 : 0;
    }
  });

  seekBar.addEventListener("input", () => {
    userSeeking = true;
  });
  seekBar.addEventListener("change", () => {
    const total = localPlayer.duration || 0;
    localPlayer.currentTime = (seekBar.value / 100) * total;
    userSeeking = false;
  });

  volumeBar.addEventListener("input", () => {
    localPlayer.volume = volumeBar.value;
  });

  // Event listeners
  playPauseBtn.addEventListener("click", togglePlayPause);
  nextBtn.addEventListener("click", playNext);
  prevBtn.addEventListener("click", playPrev);

  localPlayer.addEventListener("ended", playNext);

  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      playlist.push({ file, url });
    });
    if (currentIndex === -1 && playlist.length) loadTrack(0, false);
    updatePlaylistUI();
  });

  // Set initial volume
  localPlayer.volume = volumeBar.value;
})();
