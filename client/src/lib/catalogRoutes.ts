export type LyricCue = { start: number; end: number; text: string };

export type CatalogTrack = {
  id: number;
  albumId: number;
  title: string;
  artist: string;
  audioUrl: string;
  durationSeconds?: number | null;
  year?: number | null;
  trackNumber?: number | null;
  albumName?: string | null;
  albumArtists?: string | null;
  lrcUrl?: string | null;
  lyrics: LyricCue[];
};

export type CatalogAlbum = {
  id: number;
  title: string;
  subtitle?: string | null;
  coverImage: string;
  vinylImage?: string | null;
  releaseYear?: number | null;
  sortOrder: number;
  relatedGroupId?: string | null;
  isHiddenFromDiscography?: number;
  tracks: CatalogTrack[];
};

export const albumPath = (albumId: number) => `/albums/${albumId}`;

export const visibleDiscographyAlbums = (catalog: CatalogAlbum[]) => catalog.filter(album => !album.isHiddenFromDiscography);

export const relatedReleasesForAlbum = (catalog: CatalogAlbum[], album: CatalogAlbum) =>
  album.relatedGroupId ? catalog.filter(item => item.relatedGroupId === album.relatedGroupId && item.id !== album.id) : [];

export const albumIdFromRouteParam = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};
