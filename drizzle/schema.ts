import { int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Metadata for the personal audio library. The MP3 bytes live in managed storage;
 * this table only keeps the user-scoped reference and the player-facing metadata.
 */
export const musicTracks = mysqlTable("musicTracks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  album: varchar("album", { length: 255 }).notNull(),
  sourceKind: mysqlEnum("sourceKind", ["storage", "link"]).notNull(),
  storageKey: text("storageKey"),
  sourceUrl: text("sourceUrl").notNull(),
  filename: varchar("filename", { length: 255 }),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MusicTrack = typeof musicTracks.$inferSelect;
export type InsertMusicTrack = typeof musicTracks.$inferInsert;

export const musicLyrics = mysqlTable("musicLyrics", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull().references(() => musicTracks.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  lyricsText: text("lyricsText").notNull(),
  language: varchar("language", { length: 16 }).notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  cues: json("cues").$type<{ start: number; end: number; text: string }[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("musicLyrics_trackId_unique").on(table.trackId),
]);

export type MusicLyrics = typeof musicLyrics.$inferSelect;

/** Global, owner-managed catalog displayed to all listeners. */
export const catalogAlbums = mysqlTable("catalogAlbums", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  coverImage: text("coverImage").notNull(),
  vinylImage: text("vinylImage"),
  releaseYear: int("releaseYear"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const catalogTracks = mysqlTable("catalogTracks", {
  id: int("id").autoincrement().primaryKey(),
  albumId: int("albumId").notNull().references(() => catalogAlbums.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  audioUrl: text("audioUrl").notNull(),
  durationSeconds: int("durationSeconds"),
  year: int("year"),
  trackNumber: int("trackNumber"),
  albumName: varchar("albumName", { length: 255 }),
  albumArtists: varchar("albumArtists", { length: 500 }),
  lrcUrl: text("lrcUrl"),
  lyrics: json("lyrics").$type<{ start: number; end: number; text: string }[]>(),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CatalogAlbum = typeof catalogAlbums.$inferSelect;
export type CatalogTrack = typeof catalogTracks.$inferSelect;
