// Media player variables
let player;
let currentVideoId = '';
let currentPlayerMode = 'youtube'; // 'youtube' or 'local'
let localPlayer, audioPlayer;
let isYouTubePlayerReady = false;

// Initialize YouTube API
function onYouTubeIframeAPIReady() {
    console.log('YouTube API is ready');
    try {
        player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'rel': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
        console.log('Player instance created');
    } catch (error) {
        console.error('Error creating player:', error);
    }
}

// Player ready event
function onPlayerReady(event) {
    console.log('Player is ready');
    isYouTubePlayerReady = true;
    document.getElementById('youtube-player').classList.add('ready');
    updateTimeDisplay();
}

// Player error event
function onPlayerError(event) {
    console.error('Player error:', event.data);
}

// Player state change event
function onPlayerStateChange(event) {
    console.log('Player state changed:', event.data);
    const playPauseBtn = document.getElementById('play-pause');
    const icon = playPauseBtn.querySelector('i');
    
    if (event.data === YT.PlayerState.PLAYING) {
        icon.className = 'fas fa-pause';
        updateTimeDisplay();
    } else if (event.data === YT.PlayerState.PAUSED) {
        icon.className = 'fas fa-play';
    }
}

// Update time display
function updateTimeDisplay() {
    if (currentPlayerMode === 'youtube' && player && isYouTubePlayerReady && player.getCurrentTime) {
        const currentTime = formatTime(player.getCurrentTime());
        const duration = formatTime(player.getDuration());
        
        document.querySelector('.current-time').textContent = currentTime;
        document.querySelector('.duration').textContent = duration;
        
        const progress = (player.getCurrentTime() / player.getDuration()) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
        
        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
            requestAnimationFrame(updateTimeDisplay);
        }
    } else if (currentPlayerMode === 'local' && (localPlayer.duration || audioPlayer.duration)) {
        const activePlayer = localPlayer.style.display !== 'none' ? localPlayer : audioPlayer;
        
        // Only update if the player is defined and has a duration
        if (activePlayer && !isNaN(activePlayer.duration)) {
            const currentTime = formatTime(activePlayer.currentTime);
            const duration = formatTime(activePlayer.duration);
            
            document.querySelector('.current-time').textContent = currentTime;
            document.querySelector('.duration').textContent = duration;
            
            const progress = (activePlayer.currentTime / activePlayer.duration) * 100;
            document.querySelector('.progress').style.width = `${progress}%`;
        }
        
        if (!activePlayer.paused) {
            requestAnimationFrame(updateTimeDisplay);
        }
    }
}

// Format time
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Load YouTube video
function loadVideo() {
    const urlInput = document.getElementById('youtube-url');
    const url = urlInput.value.trim();
    
    if (url) {
        const videoId = extractVideoId(url);
        if (videoId) {
            currentVideoId = videoId;
            if (player && isYouTubePlayerReady) {
                player.loadVideoById(videoId);
                urlInput.value = '';
            } else {
                console.log('Player state:', { player, isYouTubePlayerReady });
                alert('YouTube player is not ready yet. Please wait a moment and try again.');
            }
        } else {
            alert('Please enter a valid YouTube URL');
        }
    }
}

// Extract video ID from URL
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Handle play/pause
function togglePlayPause() {
    const playPauseBtn = document.getElementById('play-pause');
    const icon = playPauseBtn.querySelector('i');
    
    if (currentPlayerMode === 'youtube') {
        if (player && isYouTubePlayerReady) {
            if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        } else {
            console.log('Player state:', { player, isYouTubePlayerReady });
            alert('YouTube player is not ready yet. Please wait a moment and try again.');
        }
    } else {
        const activePlayer = localPlayer.style.display !== 'none' ? localPlayer : audioPlayer;
        
        if (activePlayer.paused) {
            activePlayer.play();
            icon.className = 'fas fa-pause';
            updateTimeDisplay();
        } else {
            activePlayer.pause();
            icon.className = 'fas fa-play';
        }
    }
}

// Switch player mode
function switchPlayerMode(mode) {
    currentPlayerMode = mode;
    
    const youtubePlayerElement = document.getElementById('youtube-player');
    const localPlayerElement = document.getElementById('local-player');
    const audioPlayerElement = document.getElementById('audio-player');
    const youtubeInputElement = document.querySelector('.url-input');
    const fileInputElement = document.querySelector('.file-input');
    
    // Reset all players
    if (player && isYouTubePlayerReady && player.pauseVideo) {
        player.pauseVideo();
    }
    
    localPlayer.pause();
    audioPlayer.pause();
    
    // Update play/pause button
    const playPauseBtn = document.getElementById('play-pause');
    const icon = playPauseBtn.querySelector('i');
    icon.className = 'fas fa-play';
    
    // Reset progress
    document.querySelector('.progress').style.width = '0%';
    document.querySelector('.current-time').textContent = '0:00';
    document.querySelector('.duration').textContent = '0:00';
    
    // Switch source buttons
    document.getElementById('switch-youtube').classList.toggle('active', mode === 'youtube');
    document.getElementById('switch-local').classList.toggle('active', mode === 'local');
    
    // Show/hide appropriate elements
    if (mode === 'youtube') {
        youtubePlayerElement.style.display = '';
        localPlayerElement.style.display = 'none';
        audioPlayerElement.style.display = 'none';
        youtubeInputElement.style.display = '';
        fileInputElement.style.display = 'none';
    } else {
        youtubePlayerElement.style.display = 'none';
        youtubeInputElement.style.display = 'none';
        fileInputElement.style.display = '';
    }
}

// Handle local file selection
function handleLocalFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileURL = URL.createObjectURL(file);
    
    // Check if it's audio or video
    if (file.type.startsWith('audio/')) {
        localPlayer.style.display = 'none';
        audioPlayer.style.display = '';
        audioPlayer.src = fileURL;
        audioPlayer.onloadedmetadata = updateTimeDisplay;
        audioPlayer.play();
    } else {
        audioPlayer.style.display = 'none';
        localPlayer.style.display = '';
        localPlayer.src = fileURL;
        localPlayer.onloadedmetadata = updateTimeDisplay;
        localPlayer.play();
    }
    
    // Update play button
    const playPauseBtn = document.getElementById('play-pause');
    const icon = playPauseBtn.querySelector('i');
    icon.className = 'fas fa-pause';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Initialize local players
    localPlayer = document.getElementById('local-player');
    audioPlayer = document.getElementById('audio-player');
    
    // Set up time update events for local players
    localPlayer.addEventListener('timeupdate', updateTimeDisplay);
    audioPlayer.addEventListener('timeupdate', updateTimeDisplay);
    
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.defer = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    console.log('YouTube API script tag added');
    
    // Player mode switches
    document.getElementById('switch-youtube').addEventListener('click', () => switchPlayerMode('youtube'));
    document.getElementById('switch-local').addEventListener('click', () => switchPlayerMode('local'));
    
    // Button event listeners
    document.getElementById('play-pause').addEventListener('click', togglePlayPause);
    
    document.getElementById('prev').addEventListener('click', () => {
        if (currentPlayerMode === 'youtube' && player && isYouTubePlayerReady) {
            player.seekTo(player.getCurrentTime() - 10);
        } else if (currentPlayerMode === 'local') {
            const activePlayer = localPlayer.style.display !== 'none' ? localPlayer : audioPlayer;
            activePlayer.currentTime = Math.max(0, activePlayer.currentTime - 10);
        }
    });
    
    document.getElementById('next').addEventListener('click', () => {
        if (currentPlayerMode === 'youtube' && player && isYouTubePlayerReady) {
            player.seekTo(player.getCurrentTime() + 10);
        } else if (currentPlayerMode === 'local') {
            const activePlayer = localPlayer.style.display !== 'none' ? localPlayer : audioPlayer;
            activePlayer.currentTime = Math.min(activePlayer.duration, activePlayer.currentTime + 10);
        }
    });
    
    document.getElementById('load-video').addEventListener('click', loadVideo);
    document.getElementById('local-file').addEventListener('change', handleLocalFile);
    
    // Progress bar click
    document.querySelector('.progress-bar').addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        
        if (currentPlayerMode === 'youtube' && player && isYouTubePlayerReady) {
            player.seekTo(player.getDuration() * pos);
        } else if (currentPlayerMode === 'local') {
            const activePlayer = localPlayer.style.display !== 'none' ? localPlayer : audioPlayer;
            activePlayer.currentTime = activePlayer.duration * pos;
        }
    });
}); 