import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { catalogAlbums, catalogTracks, relatedAlbums } from "../drizzle/schema";
import { groupCatalog, makeTrackOrder } from "./catalog";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the database connection so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function listPublicCatalog() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [albums, tracks, related] = await Promise.all([
    db.select().from(catalogAlbums).orderBy(asc(catalogAlbums.sortOrder), asc(catalogAlbums.id)),
    db.select().from(catalogTracks).orderBy(asc(catalogTracks.albumId), asc(catalogTracks.sortOrder), asc(catalogTracks.id)),
    db.select().from(relatedAlbums),
  ]);

  const albumList = groupCatalog(albums, tracks);

  return albumList.map(album => {
    const relatedIds = new Set(
      related
        .filter(r => r.albumId === album.id || r.relatedAlbumId === album.id)
        .map(r => r.albumId === album.id ? r.relatedAlbumId : r.albumId)
    );

    const relatedReleases = Array.from(relatedIds)
      .map(id => albumList.find(a => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined);

    return {
      ...album,
      relatedReleases,
    };
  });
}

export async function createCatalogAlbum(input: { title: string; coverImage: string; vinylImage?: string; releaseYear?: number; sortOrder?: number; relatedReleases?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const valuesToInsert = {
    title: input.title,
    coverImage: input.coverImage,
    vinylImage: input.vinylImage,
    releaseYear: input.releaseYear,
    sortOrder: input.sortOrder
  };

  const [result] = await db.insert(catalogAlbums).values(valuesToInsert);
  const insertId = Number(result.insertId);

  if (input.relatedReleases && input.relatedReleases.length > 0) {
    await updateRelatedAlbums(insertId, input.relatedReleases);
  }

  const album = await db.select().from(catalogAlbums).where(eq(catalogAlbums.id, insertId)).limit(1);
  if (!album[0]) throw new Error("Album could not be created");
  return album[0];
}

export async function updateCatalogAlbum(input: { id: number; title: string; coverImage: string; vinylImage?: string; releaseYear?: number; sortOrder?: number; relatedReleases?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(catalogAlbums).set({ title: input.title, coverImage: input.coverImage, vinylImage: input.vinylImage, releaseYear: input.releaseYear, sortOrder: input.sortOrder ?? 0 }).where(eq(catalogAlbums.id, input.id));

  if (input.relatedReleases) {
    await updateRelatedAlbums(input.id, input.relatedReleases);
  }
}

export async function updateRelatedAlbums(albumId: number, relatedAlbumIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  // Remove all existing relations for this album
  await db.delete(relatedAlbums).where(eq(relatedAlbums.albumId, albumId));
  await db.delete(relatedAlbums).where(eq(relatedAlbums.relatedAlbumId, albumId));

  // Insert new bi-directional relations
  for (const relatedId of relatedAlbumIds) {
    if (relatedId !== albumId) {
      // Always store with smaller ID first to avoid duplicates and simplify bi-directional queries
      const [id1, id2] = [albumId, relatedId].sort((a, b) => a - b);

      try {
        await db.insert(relatedAlbums).values({
          albumId: id1,
          relatedAlbumId: id2,
        });
      } catch (err: any) {
        // Ignore duplicate entry errors
        if (err.code !== 'ER_DUP_ENTRY') {
          throw err;
        }
      }
    }
  }
}

export async function reorderCatalogAlbums(albumIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  for (const item of makeTrackOrder(albumIds)) {
    await db.update(catalogAlbums).set({ sortOrder: item.sortOrder }).where(eq(catalogAlbums.id, item.id));
  }
}

export async function deleteCatalogAlbum(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(catalogAlbums).where(eq(catalogAlbums.id, id));
}

export async function createCatalogTrack(input: { albumId: number; title: string; artist: string; audioUrl: string; durationSeconds?: number; trackNumber?: number; albumName?: string; albumArtists?: string; lrcUrl?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalizeTitle = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const sleeves = await db.select({ id: catalogAlbums.id, title: catalogAlbums.title }).from(catalogAlbums);
  const matchedSleeve = input.albumName ? sleeves.find((sleeve) => normalizeTitle(sleeve.title) === normalizeTitle(input.albumName ?? "")) : undefined;
  const albumId = matchedSleeve?.id ?? input.albumId;
  const [result] = await db.insert(catalogTracks).values({ ...input, albumId, sortOrder: input.sortOrder ?? (input.trackNumber ? input.trackNumber - 1 : 0) });
  const track = await db.select().from(catalogTracks).where(eq(catalogTracks.id, Number(result.insertId))).limit(1);
  if (!track[0]) throw new Error("Track could not be created");
  return track[0];
}

export async function updateCatalogTrack(input: { id: number; title: string; artist: string; audioUrl: string; durationSeconds?: number; trackNumber?: number; albumName?: string; albumArtists?: string; lrcUrl?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const current = await db.select({ sortOrder: catalogTracks.sortOrder }).from(catalogTracks).where(eq(catalogTracks.id, input.id)).limit(1);
  if (!current[0]) throw new Error("Track could not be found");
  await db.update(catalogTracks).set({ title: input.title, artist: input.artist, audioUrl: input.audioUrl, durationSeconds: input.durationSeconds, trackNumber: input.trackNumber, albumName: input.albumName, albumArtists: input.albumArtists, lrcUrl: input.lrcUrl, sortOrder: input.sortOrder ?? current[0].sortOrder }).where(eq(catalogTracks.id, input.id));
}

export async function deleteCatalogTrack(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(catalogTracks).where(eq(catalogTracks.id, id));
}

export async function reorderCatalogTracks(albumId: number, trackIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select({ id: catalogTracks.id }).from(catalogTracks).where(eq(catalogTracks.albumId, albumId));
  const existingIds = existing.map((track) => track.id).sort((a, b) => a - b);
  const requestedIds = [...trackIds].sort((a, b) => a - b);
  if (existingIds.length !== requestedIds.length || existingIds.some((id, index) => id !== requestedIds[index])) {
    throw new Error("Track order must include every track from the selected album exactly once.");
  }
  for (const item of makeTrackOrder(trackIds)) {
    await db.update(catalogTracks).set({ sortOrder: item.sortOrder }).where(and(eq(catalogTracks.id, item.id), eq(catalogTracks.albumId, albumId)));
  }
}
