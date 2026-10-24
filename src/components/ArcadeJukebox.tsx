import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Radio, ExternalLink, Disc, Sparkles } from 'lucide-react';

interface ArcadeJukeboxProps {
  isMuted: boolean;
  onToggleMute: () => void;
  className?: string;
}

export const ArcadeJukebox: React.FC<ArcadeJukeboxProps> = ({ isMuted, onToggleMute, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(75);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // YouTube video ID requested by user: Vec5yrhU-z0 ("1 HOUR ARCADE GAMING MUSIC")
  const videoId = 'Vec5yrhU-z0';

  useEffect(() => {
    // Check if user has interacted to enable audio
    const handleFirstGesture = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    // Send postMessage to YouTube iframe API
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const action = !isPlaying ? 'playVideo' : 'pauseVideo';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: action, args: [] }),
        '*'
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [newVol] }),
        '*'
      );
    }
  };

  // Embed URL with autoplay and loop for seamless retro arcade immersion
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`;

  return (
    <div
      className={`relative z-40 transition-all duration-300 pointer-events-auto ${className}`}
    >
      {/* Hidden YouTube Iframe Player */}
      <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden -top-96">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Arcade Gaming Music OST"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          className="w-1 h-1"
        />
      </div>

      {isMinimized ? (
        /* Minimized Floating Retro Token */
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-stone-950/90 hover:bg-stone-900 border border-amber-500/70 p-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-transform hover:scale-110 cursor-pointer text-xs font-mono-numbers text-amber-300 group"
          title="Expand Arcade Jukebox (1 Hour Arcade Gaming Music)"
        >
          <div className="relative">
            <Disc className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <Sparkles className="w-2.5 h-2.5 text-yellow-300 absolute -top-1 -right-1" />
          </div>
          <span className="hidden sm:inline font-fantasy text-[11px] font-bold text-amber-200 pr-1">
            ARCADE OST
          </span>
        </button>
      ) : (
        /* Full Retro Arcade Jukebox Dock */
        <div className="flex items-center gap-3 bg-stone-950/90 border-2 border-amber-600/70 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] text-xs text-amber-200">
          {/* Animated Vinyl Icon */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow ${isPlaying && !isMuted ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
              <div className="w-full h-full bg-stone-950 rounded-full flex items-center justify-center border border-amber-500/50">
                <Disc className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Track Info & Equalizer */}
          <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-[210px]">
            <div className="flex items-center gap-1.5 truncate">
              <Radio className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
              <span className="font-fantasy font-bold text-amber-100 text-[11px] truncate tracking-wide">
                ARCADE GAMING OST
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 font-mono-numbers truncate">
              <span className="truncate">1 Hour Retro Arcade Hits</span>
              {/* Retro Equalizer Bars */}
              <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                <span className={`w-0.5 bg-amber-400 rounded-xs transition-all ${isPlaying && !isMuted ? 'animate-pulse h-2.5' : 'h-1'}`} />
                <span className={`w-0.5 bg-yellow-300 rounded-xs transition-all ${isPlaying && !isMuted ? 'animate-pulse h-1.5' : 'h-1'}`} style={{ animationDelay: '0.15s' }} />
                <span className={`w-0.5 bg-orange-400 rounded-xs transition-all ${isPlaying && !isMuted ? 'animate-pulse h-3' : 'h-1'}`} style={{ animationDelay: '0.3s' }} />
                <span className={`w-0.5 bg-amber-300 rounded-xs transition-all ${isPlaying && !isMuted ? 'animate-pulse h-2' : 'h-1'}`} style={{ animationDelay: '0.45s' }} />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-amber-800/60">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Music' : 'Play Music'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-amber-300" /> : <Play className="w-3.5 h-3.5 fill-amber-300" />}
            </button>

            {/* Mute Toggle */}
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
            </button>

            {/* Volume Slider (desktop) */}
            <div className="hidden md:flex items-center gap-1 pl-1">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                title={`Volume: ${volume}%`}
              />
            </div>

            {/* Open Original YouTube Video */}
            <a
              href={`https://youtu.be/${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
              title="Watch 1 Hour Arcade Gaming Music on YouTube"
            >
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="text-stone-500 hover:text-stone-300 text-xs px-1 cursor-pointer font-bold"
              title="Minimize Jukebox"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
