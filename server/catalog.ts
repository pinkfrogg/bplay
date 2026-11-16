export type CatalogAlbumRow = { id: number; title: string; coverImage: string; vinylImage: string | null; releaseYear?: number | null; relatedGroupId?: string | null; isHiddenFromDiscography?: number; sortOrder: number };
export type CatalogTrackRow = { id: number; albumId: number; title: string; artist: string; audioUrl: string; durationSeconds: number | null; year: number | null; trackNumber: number | null; albumName: string | null; albumArtists: string | null; lrcUrl: string | null; sortOrder: number; lyrics: { start: number; end: number; text: string }[] | null };

export type CatalogAlbumUpdate = {
  id: number;
  title?: string;
  subtitle?: string | null;
  coverImage?: string;
  vinylImage?: string | null;
  releaseYear?: number | null;
  sortOrder?: number;
  isHiddenFromDiscography?: boolean;
};

export function catalogAlbumUpdateValues(input: CatalogAlbumUpdate) {
  const values: {
    title?: string;
    subtitle?: string | null;
    coverImage?: string;
    vinylImage?: string | null;
    releaseYear?: number | null;
    sortOrder?: number;
    isHiddenFromDiscography?: number;
  } = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.subtitle !== undefined) values.subtitle = input.subtitle;
  if (input.coverImage !== undefined) values.coverImage = input.coverImage;
  if (input.vinylImage !== undefined) values.vinylImage = input.vinylImage;
  if (input.releaseYear !== undefined) values.releaseYear = input.releaseYear;
  if (input.sortOrder !== undefined) values.sortOrder = input.sortOrder;
  if (input.isHiddenFromDiscography !== undefined) values.isHiddenFromDiscography = Number(input.isHiddenFromDiscography);
  return values;
}

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
