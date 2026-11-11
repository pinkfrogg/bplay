import { albumPath, type CatalogAlbum } from "./catalogRoutes";

export type CatalogSearchResult = { albumId: number; trackId?: number };
export type CatalogSearchSuggestion = CatalogSearchResult & { kind: "album" | "song" | "artist"; title: string; detail: string };

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const includesQuery = (value: string, query: string) => normalize(value).includes(query);

/** Finds a sleeve first, then a specific song, then an album artist. */
export function findCatalogSearchResult(catalog: CatalogAlbum[], rawQuery: string): CatalogSearchResult | null {
  const query = normalize(rawQuery);
  if (!query) return null;

  const album = catalog.find(item => includesQuery(item.title, query));
  if (album) return { albumId: album.id };

  for (const item of catalog) {
    const track = item.tracks.find(song => includesQuery(song.title, query));
    if (track) return { albumId: item.id, trackId: track.id };
  }

  for (const item of catalog) {
    const artistMatch = item.tracks.some(song => includesQuery(`${song.albumArtists ?? ""} ${song.artist}`, query));
    if (artistMatch) return { albumId: item.id };
  }

  return null;
}

/** Produces listener-facing choices, keeping artist matches grouped as album destinations. */
export function catalogSearchSuggestions(catalog: CatalogAlbum[], rawQuery: string, limit = 8): CatalogSearchSuggestion[] {
  const query = normalize(rawQuery);
  if (!query) return [];
  const movieSuggestions = catalog.filter(album => includesQuery(album.title, query)).map(album => ({ kind: "album" as const, albumId: album.id, title: album.title, detail: `${album.releaseYear ?? "—"} • ${album.tracks.length} tracks` }));
  const songSuggestions = catalog.flatMap(album => album.tracks.filter(track => includesQuery(track.title, query)).map(track => ({ kind: "song" as const, albumId: album.id, trackId: track.id, title: track.title, detail: `${album.title} • ${track.albumArtists || track.artist}` })));
  const artistSuggestions = catalog.flatMap(album => {
    const matchingTrack = album.tracks.find(track => includesQuery(`${track.albumArtists ?? ""} ${track.artist}`, query));
    if (!matchingTrack) return [];
    return [{ kind: "artist" as const, albumId: album.id, title: matchingTrack.albumArtists || matchingTrack.artist, detail: album.title }];
  });
  return [...movieSuggestions, ...songSuggestions, ...artistSuggestions].slice(0, limit);
}

export function catalogSearchPath(result: CatalogSearchResult) {
  if (!result.trackId) return albumPath(result.albumId);
  return `${albumPath(result.albumId)}?track=${result.trackId}&autoplay=1`;
}

export function selectedTrackIdFromSearch(search: string): number | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : "");
  if (params.get("autoplay") !== "1") return null;
  const trackId = Number(params.get("track"));
  return Number.isSafeInteger(trackId) && trackId > 0 ? trackId : null;
}
