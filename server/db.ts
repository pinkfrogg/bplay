import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { catalogAlbums, catalogTracks } from "../drizzle/schema";
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
  const [albums, tracks] = await Promise.all([
    db.select().from(catalogAlbums).orderBy(asc(catalogAlbums.sortOrder), asc(catalogAlbums.id)),
    db.select().from(catalogTracks).orderBy(asc(catalogTracks.albumId), asc(catalogTracks.sortOrder), asc(catalogTracks.id)),
  ]);
  return groupCatalog(albums, tracks);
}

export async function createCatalogAlbum(input: { title: string; coverImage: string; vinylImage?: string; releaseYear?: number; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [result] = await db.insert(catalogAlbums).values(input);
  const album = await db.select().from(catalogAlbums).where(eq(catalogAlbums.id, Number(result.insertId))).limit(1);
  if (!album[0]) throw new Error("Album could not be created");
  return album[0];
}

export async function updateCatalogAlbum(input: { id: number; title: string; coverImage: string; vinylImage?: string; releaseYear?: number; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(catalogAlbums).set({ title: input.title, coverImage: input.coverImage, vinylImage: input.vinylImage, releaseYear: input.releaseYear, sortOrder: input.sortOrder ?? 0 }).where(eq(catalogAlbums.id, input.id));
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
