class MediaPlayer {
    constructor() {
        this.audioPlayer = new Audio();
        this.videoPlayer = document.getElementById('video-player');
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.currentMediaType = null; // 'audio', 'video', or 'stream'
        this.streamProviders = {
            youtube: null,
            spotify: null
        };

        // DOM Elements
        this.playButton = document.getElementById('play');
        this.prevButton = document.getElementById('prev');
        this.nextButton = document.getElementById('next');
        this.volumeSlider = document.getElementById('volume');
        this.progressBar = document.querySelector('.progress');
        this.progressContainer = document.querySelector('.progress-bar');
        this.currentTimeSpan = document.getElementById('current-time');
        this.durationSpan = document.getElementById('duration');
        this.playlistContainer = document.getElementById('playlist-items');
        this.mediaTitle = document.querySelector('.media-title');
        this.mediaSource = document.querySelector('.media-source');
        this.fileInput = document.getElementById('media-file');
        this.streamUrl = document.getElementById('stream-url');
        this.streamBtn = document.getElementById('stream-btn');
        this.fullscreenBtn = document.getElementById('fullscreen');
        this.mediaPlayerContainer = document.querySelector('.media-player');

        this.initializeEventListeners();
        this.initializeStreamingServices();
    }

    initializeEventListeners() {
        // Play/Pause button
        this.playButton.addEventListener('click', () => this.togglePlay());

        // Previous and Next buttons
        this.prevButton.addEventListener('click', () => this.playPrevious());
        this.nextButton.addEventListener('click', () => this.playNext());

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            this.setVolume(volume);
        });

        // Progress bar
        this.progressContainer.addEventListener('click', (e) => {
            const width = this.progressContainer.clientWidth;
            const clickX = e.offsetX;
            const duration = this.getCurrentDuration();
            this.setCurrentTime((clickX / width) * duration);
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Stream URL input
        this.streamBtn.addEventListener('click', () => this.handleStreamUrl());

        // Fullscreen button
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Platform buttons
        document.querySelector('.youtube-btn').addEventListener('click', () => this.openPlatformSearch('youtube'));
        document.querySelector('.spotify-btn').addEventListener('click', () => this.openPlatformSearch('spotify'));
        document.querySelector('.saavn-btn').addEventListener('click', () => this.openPlatformSearch('saavn'));
        document.querySelector('.gaana-btn').addEventListener('click', () => this.openPlatformSearch('gaana'));

        // Media events
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.playNext());
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            this.durationSpan.textContent = this.formatTime(this.audioPlayer.duration);
        });

        this.videoPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.videoPlayer.addEventListener('ended', () => this.playNext());
        this.videoPlayer.addEventListener('loadedmetadata', () => {
            this.durationSpan.textContent = this.formatTime(this.videoPlayer.duration);
        });
    }

    initializeStreamingServices() {
        // Initialize YouTube API
        window.onYouTubeIframeAPIReady = () => {
            this.streamProviders.youtube = true;
        };

        // Initialize Spotify API
        window.onSpotifyWebPlaybackSDKReady = () => {
            this.streamProviders.spotify = true;
        };
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            const isVideo = file.type.startsWith('video/');
            const isAudio = file.type.startsWith('audio/');

            if (isVideo || isAudio) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.playlist.push({
                        name: file.name,
                        url: e.target.result,
                        type: isVideo ? 'video' : 'audio',
                        source: 'local'
                    });
                    this.updatePlaylist();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async handleStreamUrl() {
        const url = this.streamUrl.value.trim();
        if (!url) return;

        try {
            const mediaInfo = await this.getMediaInfo(url);
            if (mediaInfo) {
                this.playlist.push(mediaInfo);
                this.updatePlaylist();
                this.streamUrl.value = '';
            }
        } catch (error) {
            console.error('Error handling stream URL:', error);
            alert('Unable to play this URL. Please check the URL and try again.');
        }
    }

    async getMediaInfo(url) {
        // Check for different platform URLs and extract media info
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return this.getYouTubeInfo(url);
        } else if (url.includes('spotify.com')) {
            return this.getSpotifyInfo(url);
        } else if (url.includes('jiosaavn.com')) {
            return this.getSaavnInfo(url);
        } else if (url.includes('gaana.com')) {
            return this.getGaanaInfo(url);
        } else if (this.isValidUrl(url)) {
            return {
                name: url.split('/').pop(),
                url: url,
                type: 'stream',
                source: 'url'
            };
        }
        return null;
    }

    async getYouTubeInfo(url) {
        // Extract video ID and get info using YouTube API
        const videoId = this.extractYouTubeId(url);
        if (!videoId) return null;

        return {
            name: 'YouTube Video', // This would be replaced with actual title from API
            url: videoId,
            type: 'stream',
            source: 'youtube'
        };
    }

    extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    openPlatformSearch(platform) {
        const query = this.streamUrl.value.trim();
        if (!query) return;

        switch (platform) {
            case 'youtube':
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
                break;
            case 'spotify':
                window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank');
                break;
            case 'saavn':
                window.open(`https://www.jiosaavn.com/search/${encodeURIComponent(query)}`, '_blank');
                break;
            case 'gaana':
                window.open(`https://gaana.com/search/${encodeURIComponent(query)}`, '_blank');
                break;
        }
    }

    updatePlaylist() {
        this.playlistContainer.innerHTML = '';
        this.playlist.forEach((media, index) => {
            const li = document.createElement('li');
            const icon = this.getMediaIcon(media.type, media.source);
            li.innerHTML = `${icon} ${media.name}`;
            li.onclick = () => this.playTrack(index);
            if (index === this.currentTrackIndex) {
                li.classList.add('active');
            }
            this.playlistContainer.appendChild(li);
        });

        if (this.playlist.length === 1) {
            this.playTrack(0);
        }
    }

    getMediaIcon(type, source) {
        const icons = {
            audio: '<i class="fas fa-music"></i>',
            video: '<i class="fas fa-video"></i>',
            stream: {
                youtube: '<i class="fab fa-youtube"></i>',
                spotify: '<i class="fab fa-spotify"></i>',
                saavn: '<i class="fas fa-podcast"></i>',
                gaana: '<i class="fas fa-podcast"></i>',
                url: '<i class="fas fa-link"></i>'
            }
        };

        return type === 'stream' ? icons.stream[source] : icons[type];
    }

    playTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
            const media = this.playlist[index];

            // Reset current media
            this.audioPlayer.pause();
            this.videoPlayer.pause();
            this.videoPlayer.classList.add('hidden');

            // Set up new media
            if (media.type === 'video') {
                this.setupVideoPlayback(media);
            } else if (media.type === 'audio') {
                this.setupAudioPlayback(media);
            } else if (media.type === 'stream') {
                this.setupStreamPlayback(media);
            }

            this.mediaTitle.textContent = media.name;
            this.mediaSource.textContent = this.getSourceText(media);
            this.updatePlaylist();
        }
    }

    setupVideoPlayback(media) {
        this.currentMediaType = 'video';
        this.videoPlayer.classList.remove('hidden');
        this.videoPlayer.src = media.url;
        this.videoPlayer.play();
        this.isPlaying = true;
        this.updatePlayButton();
    }

    setupAudioPlayback(media) {
        this.currentMediaType = 'audio';
        this.audioPlayer.src = media.url;
        this.audioPlayer.play();
        this.isPlaying = true;
        this.updatePlayButton();
    }

    setupStreamPlayback(media) {
        this.currentMediaType = 'stream';
        switch (media.source) {
            case 'youtube':
                this.setupYouTubePlayback(media);
                break;
            case 'spotify':
                this.setupSpotifyPlayback(media);
                break;
            default:
                this.setupDefaultStreamPlayback(media);
        }
    }

    getSourceText(media) {
        const sources = {
            local: 'Local File',
            youtube: 'YouTube',
            spotify: 'Spotify',
            saavn: 'JioSaavn',
            gaana: 'Gaana',
            url: 'Web Stream'
        };
        return sources[media.source] || 'Unknown Source';
    }

    togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        switch (this.currentMediaType) {
            case 'video':
                this.videoPlayer.play();
                break;
            case 'audio':
                this.audioPlayer.play();
                break;
            case 'stream':
                // Handle stream play based on source
                break;
        }
        this.isPlaying = true;
        this.updatePlayButton();
    }

    pause() {
        switch (this.currentMediaType) {
            case 'video':
                this.videoPlayer.pause();
                break;
            case 'audio':
                this.audioPlayer.pause();
                break;
            case 'stream':
                // Handle stream pause based on source
                break;
        }
        this.isPlaying = false;
        this.updatePlayButton();
    }

    updatePlayButton() {
        this.playButton.innerHTML = this.isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }

    setVolume(volume) {
        this.audioPlayer.volume = volume;
        this.videoPlayer.volume = volume;
        // Handle stream volume if needed
    }

    getCurrentDuration() {
        switch (this.currentMediaType) {
            case 'video':
                return this.videoPlayer.duration;
            case 'audio':
                return this.audioPlayer.duration;
            case 'stream':
                // Return stream duration if available
                return 0;
            default:
                return 0;
        }
    }

    setCurrentTime(time) {
        switch (this.currentMediaType) {
            case 'video':
                this.videoPlayer.currentTime = time;
                break;
            case 'audio':
                this.audioPlayer.currentTime = time;
                break;
            case 'stream':
                // Handle stream seeking if available
                break;
        }
    }

    updateProgress() {
        let currentTime, duration;

        switch (this.currentMediaType) {
            case 'video':
                currentTime = this.videoPlayer.currentTime;
                duration = this.videoPlayer.duration;
                break;
            case 'audio':
                currentTime = this.audioPlayer.currentTime;
                duration = this.audioPlayer.duration;
                break;
            case 'stream':
                // Get stream progress if available
                return;
        }

        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            this.progressBar.style.width = `${progressPercent}%`;
            this.currentTimeSpan.textContent = this.formatTime(currentTime);
            this.durationSpan.textContent = this.formatTime(duration);
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.mediaPlayerContainer.requestFullscreen();
            this.mediaPlayerContainer.classList.add('fullscreen');
            this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            this.mediaPlayerContainer.classList.remove('fullscreen');
            this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    playNext() {
        if (this.playlist.length === 0) return;
        
        let nextIndex = this.currentTrackIndex + 1;
        if (nextIndex >= this.playlist.length) {
            nextIndex = 0;
        }
        this.playTrack(nextIndex);
    }

    playPrevious() {
        if (this.playlist.length === 0) return;

        let prevIndex = this.currentTrackIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.playlist.length - 1;
        }
        this.playTrack(prevIndex);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Initialize the media player
const player = new MediaPlayer(); 