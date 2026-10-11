/**
 * Muted preview video that plays while something is hovered.
 *
 * Sources:
 *  - hls / mp4: streamed straight from the source (e.g. Steam's trailer CDN).
 *    hls.js is only downloaded the first time an HLS preview plays, and only
 *    in browsers without native HLS.
 *  - youtube: a privacy-enhanced YouTube player, created on first play.
 *
 * The host element gets `is-playing` once frames are actually showing, so the
 * still image underneath stays up until the video is ready.
 */

export type VideoSource = { type: 'hls' | 'mp4'; src: string } | { type: 'youtube'; id: string };

let ytApi: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  ytApi ??= new Promise((resolve) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(w.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.append(script);
  });
  return ytApi;
}

export class HoverVideo {
  private video?: HTMLVideoElement;
  private hls?: any;
  private yt?: any;
  private ytReady = false;
  private wanted = false;

  constructor(
    private host: HTMLElement,
    private source: VideoSource,
    private start = 8,
  ) {}

  static fromElement(host: HTMLElement): HoverVideo | null {
    try {
      const source = JSON.parse(host.dataset.hoverVideo || 'null') as VideoSource | null;
      return source ? new HoverVideo(host, source, Number(host.dataset.start ?? 8)) : null;
    } catch {
      return null;
    }
  }

  async play() {
    this.wanted = true;
    if (this.source.type === 'youtube') return this.playYouTube(this.source.id);

    const v = this.ensureVideo();
    const src = this.source.src;
    if (this.source.type === 'hls' && !v.canPlayType('application/vnd.apple.mpegurl')) {
      if (!this.hls) {
        const { default: Hls } = await import('hls.js/light');
        if (!Hls.isSupported() || this.hls) return;
        this.hls = new Hls({
          startPosition: this.start,
          capLevelToPlayerSize: true,
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
        });
        // Play once the stream is attached — calling play() earlier gets
        // interrupted by hls.js swapping in its MediaSource.
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (this.wanted) v.play().catch(() => {});
        });
        this.hls.loadSource(src);
        this.hls.attachMedia(v);
        return;
      } else {
        this.hls.startLoad(this.start);
        v.currentTime = this.start;
      }
    } else if (!v.src) {
      v.src = src;
      v.addEventListener('loadedmetadata', () => (v.currentTime = this.start), { once: true });
    } else {
      v.currentTime = this.start;
    }
    if (this.wanted) v.play().catch(() => {});
  }

  stop() {
    this.wanted = false;
    this.host.classList.remove('is-playing');
    if (this.video) {
      this.video.pause();
      this.hls?.stopLoad();
    }
    if (this.yt && this.ytReady) this.yt.pauseVideo();
  }

  private ensureVideo() {
    if (!this.video) {
      const v = document.createElement('video');
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.loop = true;
      v.preload = 'none';
      v.setAttribute('aria-hidden', 'true');
      v.addEventListener('playing', () => {
        if (this.wanted) this.host.classList.add('is-playing');
      });
      // Belt and braces: if an earlier play() was interrupted, try again once frames are ready.
      v.addEventListener('canplay', () => {
        if (this.wanted && v.paused) v.play().catch(() => {});
      });
      this.host.append(v);
      this.video = v;
    }
    return this.video;
  }

  private async playYouTube(id: string) {
    if (this.yt) {
      if (this.ytReady) {
        this.yt.seekTo(this.start, true);
        this.yt.playVideo();
      }
      return;
    }
    const YT = await loadYouTubeApi();
    if (this.yt) return;
    const mount = document.createElement('div');
    this.host.append(mount);
    this.yt = new YT.Player(mount, {
      host: 'https://www.youtube-nocookie.com',
      videoId: id,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 1,
        playlist: id,
        playsinline: 1,
        rel: 0,
        start: this.start,
      },
      events: {
        onReady: (e: any) => {
          this.ytReady = true;
          e.target.mute();
          if (this.wanted) e.target.playVideo();
          else e.target.pauseVideo();
        },
        onStateChange: (e: any) => {
          if (e.data !== YT.PlayerState.PLAYING) return;
          if (this.wanted) this.host.classList.add('is-playing');
          else e.target.pauseVideo();
        },
      },
    });
  }
}
