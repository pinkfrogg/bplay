export type CatalogAlbumRow = { id: number; title: string; coverImage: string; vinylImage: string | null; releaseYear?: number | null; sortOrder: number };
export type CatalogTrackRow = { id: number; albumId: number; title: string; artist: string; audioUrl: string; durationSeconds: number | null; year: number | null; trackNumber: number | null; albumName: string | null; albumArtists: string | null; lrcUrl: string | null; sortOrder: number; lyrics: { start: number; end: number; text: string }[] | null };

export function groupCatalog(albums: CatalogAlbumRow[], tracks: CatalogTrackRow[]) {
  return albums.map((album) => ({
    ...album,
    tracks: tracks.filter((track) => track.albumId === album.id).map((track) => ({
      ...track,
      lyrics: track.lyrics ?? [],
    })),
  }));
}

export function makeTrackOrder(trackIds: number[]) {
  return trackIds.map((id, sortOrder) => ({ id, sortOrder }));
}
