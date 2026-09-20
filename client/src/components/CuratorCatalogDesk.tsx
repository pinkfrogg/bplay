import { trpc } from "@/lib/trpc";
import { nextCuratorSleeveId, visibleCuratorSleeves } from "@/lib/curatorDisclosure";
import { albumReleaseYearFromInput } from "@/lib/catalogReleaseYear";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, GripVertical, Plus, Save, Search, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Track = { id: number; albumId: number; title: string; artist: string; audioUrl: string; durationSeconds?: number | null; trackNumber?: number | null; albumName?: string | null; albumArtists?: string | null; lrcUrl?: string | null };
type Album = { id: number; title: string; coverImage: string; vinylImage?: string | null; releaseYear?: number | null; tracks: Track[] };

const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default function CuratorCatalogDesk({ catalog }: { catalog: Album[] }) {
  const utils = trpc.useUtils();
  const createAlbum = trpc.catalog.createAlbum.useMutation();
  const updateAlbum = trpc.catalog.updateAlbum.useMutation();
  const deleteAlbum = trpc.catalog.deleteAlbum.useMutation();
  const createTrack = trpc.catalog.createTrack.useMutation();
  const updateTrack = trpc.catalog.updateTrack.useMutation();
  const deleteTrack = trpc.catalog.deleteTrack.useMutation();
  const reorderTracks = trpc.catalog.reorderTracks.useMutation();
  const fetchMp3Metadata = trpc.catalog.fetchMp3Metadata.useMutation();
  const [query, setQuery] = useState("");
  const [albumFilter, setAlbumFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [dragged, setDragged] = useState<{ albumId: number; trackId: number } | null>(null);
  const [expandedAlbumId, setExpandedAlbumId] = useState<number | null>(null);
  const [albumTitle, setAlbumTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [vinylImage, setVinylImage] = useState("");
  const [albumReleaseYear, setAlbumReleaseYear] = useState("");
  const [trackAlbumId, setTrackAlbumId] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [trackDuration, setTrackDuration] = useState<number | undefined>();
  const [trackNumber, setTrackNumber] = useState<number | undefined>();
  const [trackAlbumArtists, setTrackAlbumArtists] = useState("");
  const [trackLrcUrl, setTrackLrcUrl] = useState("");
  const refresh = () => utils.catalog.list.invalidate();
  const visibleAlbums = useMemo(() => visibleCuratorSleeves(catalog, query, albumFilter), [albumFilter, catalog, query]);
  const optionalNumber = (value: FormDataEntryValue | null) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : undefined;
  };

  const addAlbum = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createAlbum.mutateAsync({ title: albumTitle, coverImage, vinylImage: vinylImage || undefined, releaseYear: albumReleaseYearFromInput(albumReleaseYear) });
      setAlbumTitle(""); setCoverImage(""); setVinylImage(""); setAlbumReleaseYear("");
      setMessage("Movie sleeve and vinyl art filed.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The sleeve could not be saved.");
    }
  };

  const fetchMetadata = async () => {
    if (!trackUrl.trim()) return;
    try {
      const metadata = await fetchMp3Metadata.mutateAsync({ audioUrl: trackUrl });
      if (metadata.status === "unavailable") { setMessage(metadata.message); return; }
      if (metadata.title && !trackTitle.trim()) setTrackTitle(metadata.title);
      setTrackDuration(metadata.durationSeconds || undefined);
      setTrackNumber(metadata.trackNumber || undefined);
      setTrackAlbumArtists(metadata.albumArtists);
      const albumNeedle = normalize(metadata.albumName);
      const matchingAlbum = albumNeedle ? catalog.find(album => {
        const title = normalize(album.title);
        return title === albumNeedle || title.includes(albumNeedle) || albumNeedle.includes(title);
      }) : undefined;
      if (matchingAlbum) setTrackAlbumId(String(matchingAlbum.id));
      const sourceMessage = metadata.status === "fallback" ? metadata.message : "MP3 tags read.";
      setMessage(matchingAlbum ? `${sourceMessage} Matched and selected the “${matchingAlbum.title}” sleeve; track number sets its saved play order.` : `${sourceMessage} Review the fields and choose a matching sleeve before saving.`);
    } catch {
      setMessage("Metadata lookup is unavailable right now. You can still save the link and complete the fields manually.");
    }
  };

  const resetTrack = () => {
    setTrackTitle(""); setTrackUrl(""); setTrackDuration(undefined); setTrackNumber(undefined); setTrackAlbumArtists(""); setTrackLrcUrl("");
  };

  const addTrack = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const selectedSleeve = catalog.find(album => album.id === Number(trackAlbumId));
      await createTrack.mutateAsync({ albumId: Number(trackAlbumId), title: trackTitle, artist: trackAlbumArtists || "Album artist unavailable", audioUrl: trackUrl, durationSeconds: trackDuration, trackNumber, albumName: selectedSleeve?.title, albumArtists: trackAlbumArtists || undefined, lrcUrl: trackLrcUrl || undefined });
      resetTrack();
      setMessage("Track filed. The movie sleeve and track number determine its catalog position.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The track could not be saved.");
    }
  };

  const saveAlbum = async (event: FormEvent<HTMLFormElement>, album: Album) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await updateAlbum.mutateAsync({ id: album.id, title: String(data.get("title")), coverImage: String(data.get("coverImage")), vinylImage: String(data.get("vinylImage") || "") || undefined, releaseYear: albumReleaseYearFromInput(data.get("releaseYear")) });
      setMessage("Sleeve and vinyl artwork updated.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The sleeve could not be updated.");
    }
  };

  const saveTrack = async (event: FormEvent<HTMLFormElement>, track: Track) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await updateTrack.mutateAsync({ id: track.id, title: String(data.get("title")), artist: track.artist, audioUrl: String(data.get("audioUrl")), durationSeconds: optionalNumber(data.get("durationSeconds")), trackNumber: optionalNumber(data.get("trackNumber")), albumName: track.albumName ?? undefined, albumArtists: String(data.get("albumArtists") || "") || undefined, lrcUrl: String(data.get("lrcUrl") || "") || undefined });
      setMessage("Track details and saved play order updated.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The track could not be updated.");
    }
  };

  const saveOrder = async (album: Album, next: Track[]) => {
    try {
      await reorderTracks.mutateAsync({ albumId: album.id, trackIds: next.map(track => track.id) });
      setMessage("Manual track order saved.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The track order could not be saved.");
    }
  };

  const dropTrack = (album: Album, targetId: number) => {
    if (!dragged || dragged.albumId !== album.id || dragged.trackId === targetId) return;
    const from = album.tracks.findIndex(track => track.id === dragged.trackId);
    const to = album.tracks.findIndex(track => track.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...album.tracks];
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);
    setDragged(null);
    void saveOrder(album, next);
  };

  const moveTrack = (album: Album, from: number, direction: -1 | 1) => {
    const to = from + direction;
    if (to < 0 || to >= album.tracks.length) return;
    const next = [...album.tracks];
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);
    void saveOrder(album, next);
  };

  const removeAlbum = async (albumId: number) => {
    try {
      await deleteAlbum.mutateAsync({ id: albumId });
      if (expandedAlbumId === albumId) setExpandedAlbumId(null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The sleeve could not be removed.");
    }
  };

  const removeTrack = async (trackId: number) => {
    try {
      await deleteTrack.mutateAsync({ id: trackId });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The track could not be removed.");
    }
  };

  return <section className="curator-desk curator-desk-enhanced" aria-labelledby="catalog-desk-heading">
    <div className="curator-desk-heading"><div><p className="eyebrow">Owner-only editor</p><h2 id="catalog-desk-heading">Curator’s catalog desk</h2><p>Fetch song title, sleeve album, album artists, year, and track number from MP3 tags.</p></div></div>
    <div className="desk-grid">
      <form className="desk-form" onSubmit={addAlbum}><h3><Plus size={15} /> Add a movie sleeve</h3><label>Movie / album title<input value={albumTitle} onChange={event => setAlbumTitle(event.target.value)} required placeholder="e.g. Barbie of Swan Lake" /></label><label>Release year<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={albumReleaseYear} onChange={event => setAlbumReleaseYear(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="e.g. 2002" /></label><label>DVD / sleeve image URL<input value={coverImage} onChange={event => setCoverImage(event.target.value)} required placeholder="https://… or /manus-storage/…" /></label><label>Full vinyl image URL<input value={vinylImage} onChange={event => setVinylImage(event.target.value)} placeholder="Optional; falls back to sleeve art" /></label><button type="submit" disabled={createAlbum.isPending}><Save size={14} /> Save sleeve</button></form>
      <form className="desk-form" onSubmit={addTrack}><h3><Plus size={15} /> Add a track</h3><label>Movie sleeve<select value={trackAlbumId} onChange={event => setTrackAlbumId(event.target.value)} required><option value="" disabled>Choose an album</option>{catalog.map(album => <option key={album.id} value={album.id}>{album.title}</option>)}</select></label><label>Song title<input value={trackTitle} onChange={event => setTrackTitle(event.target.value)} required /></label><label>Direct MP3 URL<input value={trackUrl} onChange={event => setTrackUrl(event.target.value)} onBlur={() => void fetchMetadata()} required placeholder="Paste a direct .mp3 link" /></label><label>Optional .LRC URL<input type="url" value={trackLrcUrl} onChange={event => setTrackLrcUrl(event.target.value)} placeholder="Paste a direct .lrc link" /></label><button className="metadata-fetch" type="button" onClick={() => void fetchMetadata()} disabled={fetchMp3Metadata.isPending || !trackUrl}><Sparkles size={14} /> {fetchMp3Metadata.isPending ? "Reading MP3…" : "Fetch MP3 tags"}</button><div className="tag-grid"><label>Track number<input type="number" min="1" value={trackNumber ?? ""} onChange={event => setTrackNumber(optionalNumber(event.target.value))} /></label><label>Album artist(s)<input value={trackAlbumArtists} onChange={event => setTrackAlbumArtists(event.target.value)} /></label></div>{trackDuration && <p className="metadata-result">Duration saved: {Math.floor(trackDuration / 60)}:{String(trackDuration % 60).padStart(2, "0")}</p>}<button type="submit" disabled={createTrack.isPending || !catalog.length}><Save size={14} /> Save track</button></form>
    </div>
    <div className="desk-search" role="search"><Search size={16} /><input aria-label="Search album or track" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search movie, song, or album artist" /><select aria-label="Filter by movie sleeve" value={albumFilter} onChange={event => setAlbumFilter(event.target.value)}><option value="all">All sleeves</option>{catalog.map(album => <option key={album.id} value={album.id}>{album.title}</option>)}</select></div>
    {message && <p className="editor-message" role="status">{message}</p>}
    <div className="desk-existing" aria-label="Saved movie sleeves">
      {visibleAlbums.length ? visibleAlbums.map(album => {
        const isExpanded = expandedAlbumId === album.id;
        return <article className={isExpanded ? "desk-sleeve-entry desk-sleeve-entry--expanded" : "desk-sleeve-entry"} key={album.id}>
          <button className="desk-sleeve-trigger" type="button" aria-expanded={isExpanded} aria-controls={`sleeve-editor-${album.id}`} onClick={() => setExpandedAlbumId(current => nextCuratorSleeveId(current, album.id))}><span>{album.title}</span>{isExpanded ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}</button>
          {isExpanded && <div id={`sleeve-editor-${album.id}`} className="desk-sleeve-editor">
            <form className="desk-album" onSubmit={event => void saveAlbum(event, album)}><div className="desk-inline-title"><h3>Movie sleeve</h3><button className="desk-delete" type="button" onClick={() => void removeAlbum(album.id)}><Trash2 size={14} /> Remove sleeve</button></div><label>Album title<input name="title" defaultValue={album.title} required /></label><label>Release year<input name="releaseYear" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} defaultValue={album.releaseYear ?? ""} placeholder="e.g. 2002" /></label><label>DVD / sleeve image URL<input name="coverImage" defaultValue={album.coverImage} required /></label><label>Full vinyl image URL<input name="vinylImage" defaultValue={album.vinylImage ?? ""} /></label><button type="submit" disabled={updateAlbum.isPending}><Save size={14} /> Update artwork</button></form>
            <p className="drag-hint"><GripVertical size={14} /> Fetched track numbers set the initial play order. Drag or use Move up and Move down to arrange it further.</p>
            {album.tracks.map((track, index) => <form className={dragged?.trackId === track.id ? "desk-track desk-track--dragging" : "desk-track"} key={track.id} onSubmit={event => void saveTrack(event, track)} onDragOver={event => event.preventDefault()} onDrop={() => dropTrack(album, track.id)}><div className="desk-inline-title"><h4 draggable onDragStart={() => setDragged({ albumId: album.id, trackId: track.id })} onDragEnd={() => setDragged(null)} className="track-drag-handle"><GripVertical size={15} /> {track.trackNumber ? `Track ${track.trackNumber}` : `Track ${index + 1}`}</h4><div className="track-order-actions"><button type="button" className="desk-delete" disabled={index === 0} onClick={() => moveTrack(album, index, -1)}><ArrowUp size={13} /> Up</button><button type="button" className="desk-delete" disabled={index === album.tracks.length - 1} onClick={() => moveTrack(album, index, 1)}><ArrowDown size={13} /> Down</button><button className="desk-delete" type="button" onClick={() => void removeTrack(track.id)}><Trash2 size={14} /> Remove</button></div></div><label>Song title<input name="title" defaultValue={track.title} required /></label><label>Direct MP3 URL<input name="audioUrl" defaultValue={track.audioUrl} required /></label><label>LRC URL (optional)<input name="lrcUrl" type="url" defaultValue={track.lrcUrl ?? ""} placeholder="Paste a direct .lrc link" /></label><div className="tag-grid"><label>Track number<input name="trackNumber" type="number" min="1" defaultValue={track.trackNumber ?? ""} /></label><label>Album artist(s)<input name="albumArtists" defaultValue={track.albumArtists ?? ""} /></label><label>Duration seconds<input name="durationSeconds" type="number" min="1" defaultValue={track.durationSeconds ?? ""} /></label></div><button type="submit" disabled={updateTrack.isPending}><Save size={14} /> Update track</button></form>)}
          </div>}
        </article>;
      }) : <p className="desk-no-results">No sleeves or tracks match this search.</p>}
    </div>
  </section>;
}
