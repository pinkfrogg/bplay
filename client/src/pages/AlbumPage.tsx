import CollectionGlitter from "@/components/CollectionGlitter";
import ListeningRail from "@/components/ListeningRail";
import MarqueeTitle from "@/components/MarqueeTitle";
import PrincessCrown from "@/components/PrincessCrown";
import { useTheme } from "@/contexts/ThemeContext";
import { catalogSearchPath, catalogSearchSuggestions, selectedTrackIdFromSearch } from "@/lib/catalogSearch";
import { albumIdFromRouteParam, type CatalogAlbum, type CatalogTrack } from "@/lib/catalogRoutes";
import type { LrcCue } from "@/lib/lrc";
import { activeLyricCueIndex, lyricStageCues, selectedTrackLyricCues } from "@/lib/lyricPlayback";
import { searchSuggestionReserveHeight } from "@/lib/searchLayout";
import { trpc } from "@/lib/trpc";
import { SkipBack, SkipForward, Disc3, ListMusic, Moon, Pause, Play, Sun, Volume2, Repeat, Repeat1, Shuffle } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useEffect, useMemo, useRef, useState } from "react";

const HERO_ART = "/manus-storage/rosewood-listening-room-hero_eef780b8.jpg";
const IDLE_COVER = "/manus-storage/rose-petal-vinyl-sleeve_1ef35f07.jpg";
const IDLE_SPECTRUM = Array.from({ length: 28 }, (_, index) => 0.16 + ((index * 7) % 10) / 100);
const clock = (time: number) => !Number.isFinite(time) ? "0:00" : `${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, "0")}`;

export default function AlbumPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const routeAlbumId = albumIdFromRouteParam(albumId);
  const catalogQuery = trpc.catalog.list.useQuery();
  const catalog = (catalogQuery.data ?? []) as CatalogAlbum[];
  const album = catalog.find(item => item.id === routeAlbumId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const progressFrameRef = useRef<number | null>(null);
  const [trackId, setTrackId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [autoplayTrack, setAutoplayTrack] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [spectrum, setSpectrum] = useState(IDLE_SPECTRUM);
  const [loopMode, setLoopMode] = useState<"all" | "track">("all");
  const [shuffleMode, setShuffleMode] = useState(false);
  const [playHistory, setPlayHistory] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [lrcCues, setLrcCues] = useState<LrcCue[]>([]);
  const { theme, toggleTheme } = useTheme();
  const tracks = album?.tracks ?? [];
  const track = tracks.find(item => item.id === trackId);
  const index = tracks.findIndex(item => item.id === trackId);
  const cover = album?.coverImage ?? IDLE_COVER;
  const vinylArt = album?.vinylImage ?? cover;
  const lyricCues = selectedTrackLyricCues({ trackId, lrcUrl: track?.lrcUrl, lrcCues, curatedCues: track?.lyrics ?? [] });
  const lyricIndex = activeLyricCueIndex(lyricCues, elapsed);
  const floatingLyricCues = lyricStageCues(lyricCues, lyricIndex);
  const progressLimit = duration || track?.durationSeconds || 0;
  const searchedTrackId = selectedTrackIdFromSearch(window.location.search);
  const [searchAutoplayApplied, setSearchAutoplayApplied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const fetchLrc = trpc.catalog.fetchLrc.useMutation();
  const [, navigate] = useLocation();
  const suggestions = useMemo(() => catalogSearchSuggestions(catalog, searchQuery), [catalog, searchQuery]);
  const searchReserveHeight = searchSuggestionReserveHeight(searchQuery, suggestions.length);

  useEffect(() => {
    let active = true;
    setLrcCues([]);
    if (!track?.lrcUrl) return () => { active = false; };

    void fetchLrc.mutateAsync({ lrcUrl: track.lrcUrl })
      .then(cues => { if (active) setLrcCues(cues); })
      .catch(() => { if (active) setLrcCues([]); });

    return () => { active = false; };
  }, [track?.id, track?.lrcUrl, fetchLrc.mutateAsync]);

  const stopSpectrum = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setSpectrum(IDLE_SPECTRUM);
  };

  const startSpectrum = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!contextRef.current) {
        const context = new AudioContext();
        const analyser = context.createAnalyser();
        const source = context.createMediaElementSource(audio);
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;
        source.connect(analyser);
        analyser.connect(context.destination);
        contextRef.current = context;
        analyserRef.current = analyser;
      }
      await contextRef.current.resume();
      const analyser = analyserRef.current;
      if (!analyser) return;
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        analyser.getByteFrequencyData(bins);
        setSpectrum(Array.from({ length: 28 }, (_, itemIndex) => Math.max(0.1, Math.min(1, (bins[Math.min(2 + itemIndex * 2, bins.length - 1)] + bins[Math.min(3 + itemIndex * 2, bins.length - 1)]) / 510))));
        frameRef.current = requestAnimationFrame(draw);
      };
      stopSpectrum();
      draw();
    } catch {
      stopSpectrum();
    }
  };

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => {
    if (!autoplayTrack || !track || !audioRef.current) return;
    const audio = audioRef.current;
    const start = async () => {
      try {
        await audio.play();
        setAutoplayTrack(false);
      } catch {
        setAutoplayTrack(false);
        setError("This MP3 could not play. The curator should confirm its direct link.");
      }
    };
    if (audio.readyState >= 2) void start();
    else audio.addEventListener("canplay", start, { once: true });
    return () => audio.removeEventListener("canplay", start);
  }, [autoplayTrack, track?.id]);
  useEffect(() => () => { stopSpectrum(); void contextRef.current?.close(); }, []);
  useEffect(() => {
    if (!playing) return;
    const sync = () => {
      if (audioRef.current && !seeking) setElapsed(audioRef.current.currentTime);
      progressFrameRef.current = requestAnimationFrame(sync);
    };
    sync();
    return () => {
      if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = null;
    };
  }, [playing, seeking]);

  const selectTrack = (next: CatalogTrack, shouldAutoplay = false, skipHistory = false) => {
    if (!skipHistory && trackId !== null) {
      setPlayHistory(history => [...history, trackId]);
    }
    audioRef.current?.pause();
    setTrackId(next.id);
    setElapsed(0);
    setDuration(next.durationSeconds ?? 0);
    setPlaying(false);
    setSeeking(false);
    setAutoplayTrack(shouldAutoplay);
    setError("");
    stopSpectrum();
  };

  useEffect(() => {
    if (searchAutoplayApplied || !searchedTrackId || !album) return;
    const searchedTrack = album.tracks.find(item => item.id === searchedTrackId);
    if (searchedTrack) {
      selectTrack(searchedTrack, true);
      setSearchAutoplayApplied(true);
    }
  }, [album, searchAutoplayApplied, searchedTrackId]);

  const toggleLoop = () => setLoopMode(mode => mode === "all" ? "track" : "all");

  const toggleShuffle = () => setShuffleMode(mode => !mode);

  const move = (direction: -1 | 1) => {
    if (!tracks.length) return;

    if (shuffleMode && direction === 1) {
      if (tracks.length === 1) {
        selectTrack(tracks[0], true);
        return;
      }
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * tracks.length);
      } while (randomIndex === index);
      selectTrack(tracks[randomIndex], true);
      return;
    }

    if (shuffleMode && direction === -1) {
      if (playHistory.length > 0) {
        const lastTrackId = playHistory[playHistory.length - 1];
        setPlayHistory(history => history.slice(0, -1));
        const prevTrack = tracks.find(t => t.id === lastTrackId);
        if (prevTrack) {
          selectTrack(prevTrack, true, true);
          return;
        }
      }
    }

    const next = tracks[(index < 0 ? 0 : index + direction + tracks.length) % tracks.length];
    selectTrack(next, true);
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    setError("");
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
      setError("This MP3 could not play. The curator should confirm its direct link.");
    }
  };

  const openSearchResult = (result: Parameters<typeof catalogSearchPath>[0]) => {
    setSearchQuery("");
    setSearchMessage("");
    navigate(catalogSearchPath(result));
  };

  const searchCollection = () => {
    const result = suggestions[0];
    if (!result) {
      setSearchMessage(searchQuery.trim() ? "No movie, song, or album artist matched that search." : "Enter a movie, song, or album artist to search.");
      return;
    }
    openSearchResult(result);
  };

  const albumTitle = album?.title ?? "Movie album";

  return <div className="listening-room curated-room album-page-room">
    <audio
      ref={audioRef}
      crossOrigin="anonymous"
      src={track?.audioUrl}
      onPlay={() => { setPlaying(true); void startSpectrum(); }}
      onPause={() => { setPlaying(false); stopSpectrum(); }}
      onTimeUpdate={event => { if (!seeking) setElapsed(event.currentTarget.currentTime); }}
      onLoadedMetadata={event => setDuration(event.currentTarget.duration)}
      onDurationChange={event => Number.isFinite(event.currentTarget.duration) && setDuration(event.currentTarget.duration)}
      onSeeking={() => setSeeking(true)}
      onSeeked={event => { setSeeking(false); setElapsed(event.currentTarget.currentTime); }}
      onEnded={() => {
        setElapsed(progressLimit);
        if (loopMode === "track") {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            void audioRef.current.play();
            setElapsed(0);
          }
        } else {
          move(1);
        }
      }}
      onError={() => setError("This MP3 could not play. The curator should confirm its direct link.")}
    />
    <ListeningRail search={{ query: searchQuery, isLoading: catalogQuery.isLoading, suggestions, message: searchMessage, onQueryChange: value => { setSearchQuery(value); setSearchMessage(""); }, onSubmit: searchCollection, onSelect: openSearchResult }} />
    <main className="listening-stage">
      <CollectionGlitter />
      <img className="stage-atmosphere" src={HERO_ART} alt="" />
      <header className="album-page-header">
        <div className="album-page-header-main">
          <Link className="album-back-link" href="/">← Back to discography</Link>
          <div className="album-page-heading">
            <span className="album-page-sleeve"><img src={cover} alt={`${albumTitle} DVD sleeve`} /><i>DVD / SOUNDTRACK</i></span>
            <div><p className="eyebrow">{album?.subtitle ?? "Movie soundtrack"}</p><h1>{albumTitle}</h1><p>{album ? `${album.releaseYear ?? "—"} • ${album.tracks.length} TRACKS` : catalogQuery.isLoading ? "Opening the album…" : "This sleeve is unavailable."}</p></div>
          </div>
        </div>
        <div className="stage-tools"><button className="theme-toggle" type="button" aria-label="Toggle evening dusk theme" onClick={toggleTheme}>{theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}{theme === "dark" ? "Daylight" : "Evening dusk"}</button></div>
      </header>
      <div className="rail-search-reserve" style={{ height: searchReserveHeight }} aria-hidden="true" />
      {catalogQuery.isLoading ? <section className="album-page-empty"><strong>Opening the soundtrack…</strong><span>The curated tracks are being arranged.</span></section> : !album ? <section className="album-page-empty"><strong>This movie sleeve is unavailable.</strong><Link href="/">Return to Discography</Link></section> : <>
        <section className="album-page-tracklist" aria-labelledby="album-tracklist-heading">
          <div className="album-page-section-heading"><PrincessCrown /><h2 id="album-tracklist-heading">Tracks</h2></div>
          <ol className="album-page-tracks">{tracks.map((song, itemIndex) => {
            const isSelectedTrack = song.id === trackId;
            const isPlayingTrack = isSelectedTrack && playing;
            return <li key={song.id}><button className={isPlayingTrack ? "album-page-track-button album-page-track-button--playing" : isSelectedTrack ? "album-page-track-button album-page-track-button--active" : "album-page-track-button"} type="button" onClick={() => selectTrack(song, true)} aria-current={isPlayingTrack ? "true" : undefined}><span className="album-page-track-number">{String(itemIndex + 1).padStart(2, "0")}</span><span className="album-page-track-title"><strong>{song.title}</strong></span><small>{song.albumArtists || song.artist}</small><time>{song.durationSeconds ? clock(song.durationSeconds) : "—"}</time></button></li>;
          })}</ol>
        </section>
        <section className="turntable-area">
          <div className="record-presentation"><div className={`vinyl ${playing ? "vinyl--spinning" : ""}`}><img className="vinyl-art" src={vinylArt} alt="" /><span className="vinyl-grooves" aria-hidden="true" /><span className="vinyl-hole" aria-hidden="true" /></div><div className={`tonearm ${playing ? "tonearm--engaged" : ""}`}><i className="tonearm-pivot" aria-hidden="true" /><span className="tonearm-assembly" aria-hidden="true"><i className="tonearm-arm" /><i className="tonearm-cartridge" /></span></div><div className="sleeve-backdrop"><img src={cover} alt="" /></div></div>
          <div className="track-details"><MarqueeTitle active={Boolean(track && playing)}>{track?.title ?? "Pick a song to begin the listening room."}</MarqueeTitle>{track && <><p className="artist-line">{track.albumArtists || track.artist}</p><p className="album-credit">{album.title}</p></>}{error && <p className="playback-error">{error}</p>}</div>
        </section>
        <section className={`visualizer visualizer--minimal ${playing ? "visualizer--active" : ""}`}><div className="spectrum-bars">{spectrum.map((level, itemIndex) => <i key={itemIndex} style={{ height: `${Math.round(level * 100)}%` }} />)}</div></section>
        <section className="transport"><div className="timeline-row"><span>{clock(elapsed)}</span><input className="progress-scrubber" aria-label="Drag to seek anywhere in the track" aria-valuetext={`${clock(elapsed)} of ${clock(progressLimit)}`} type="range" min="0" max={progressLimit || 1} step="0.01" value={Math.min(elapsed, progressLimit || 0)} disabled={!track || !progressLimit} onPointerDown={() => setSeeking(true)} onPointerUp={event => { const time = Number((event.currentTarget as HTMLInputElement).value); if (audioRef.current) audioRef.current.currentTime = time; setElapsed(time); setSeeking(false); }} onChange={event => { const time = Number(event.target.value); setElapsed(time); if (audioRef.current) audioRef.current.currentTime = time; }} /><span>{clock(progressLimit)}</span></div><div className="control-row"><button className={`icon-button ${loopMode === "track" ? "icon-button--active" : ""}`} aria-label="Toggle loop mode" onClick={toggleLoop}>{loopMode === "track" ? <Repeat1 size={20} /> : <Repeat size={20} />}</button><button className="icon-button" aria-label="Previous track" onClick={() => move(-1)} disabled={tracks.length < 2}><SkipBack size={20} fill="currentColor" /></button><button className="play-button" aria-label={playing ? "Pause" : "Play"} onClick={toggle} disabled={!track}>{playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button><button className="icon-button" aria-label="Next track" onClick={() => move(1)} disabled={tracks.length < 2}><SkipForward size={20} fill="currentColor" /></button><button className={`icon-button ${shuffleMode ? "icon-button--active" : ""}`} aria-label="Toggle shuffle" onClick={toggleShuffle} disabled={tracks.length < 2}><Shuffle size={20} /></button><label className="volume-control"><Volume2 size={16} /><input aria-label="Volume" type="range" min="0" max="1" step=".01" value={volume} onChange={event => setVolume(Number(event.target.value))} /><span>{Math.round(volume * 100)}</span></label></div></section>
        <section className="lyrics-section">
          <div className="lyrics-header"><div className="section-heading"><ListMusic size={18} aria-hidden="true" /><h2>Lyrics</h2></div></div>
          {lyricCues.length ? <div className={lyricIndex < 0 ? "lyric-stage lyric-stage--waiting" : "lyric-stage"} aria-live="polite">
            {floatingLyricCues.map(({ cue, index: cueIndex, position }) => <button key={`${cue.start}-${cueIndex}`} className={`lyric-stage-line lyric-stage-line--${position}`} type="button" onClick={() => { if (audioRef.current) audioRef.current.currentTime = cue.start; setElapsed(cue.start); }} aria-label={`Seek to ${clock(cue.start)}: ${cue.text}`}><span>{cue.text}</span></button>)}
            {lyricIndex < 0 && <p>The first line arrives with the music.</p>}
          </div> : <div className="lyrics-empty"><ListMusic size={22} /><div><strong>No lyrics found in the Dreamhouse</strong><span>Even pop-stars improvise. Lip-sync dramatically, bestie</span></div></div>}
        </section>
      </>}
    </main>
  </div>;
}
