import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { createCatalogAlbum, createCatalogTrack, deleteCatalogAlbum, deleteCatalogTrack, listPublicCatalog, reorderCatalogTracks, updateCatalogAlbum, updateCatalogTrack } from "./db";
import { readMp3Metadata } from "./mp3Metadata";
import { readLrc } from "./lrc.ts";
import { publicProcedure, router } from "./_core/trpc";
import { createOwnerSession, hasOwnerSession, OWNER_ADMIN_COOKIE, OWNER_SESSION_MAX_AGE_MS, verifyOwnerCredentials } from "./adminAuth";

const catalogImageUrl = z.string().min(1).max(2048).refine((value) => value.startsWith("/manus-storage/") || /^https?:\/\//.test(value), "Use a managed asset path or an HTTP(S) image URL.");
const catalogTrackInput = z.object({ title: z.string().min(1).max(255), artist: z.string().min(1).max(255), audioUrl: z.string().url().max(2048), durationSeconds: z.number().int().positive().optional(), trackNumber: z.number().int().positive().optional(), albumName: z.string().max(255).optional(), albumArtists: z.string().max(500).optional(), lrcUrl: z.string().url().max(2048).optional() });
const ownerProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!hasOwnerSession(ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Owner sign-in is required." });
  return next();
});

export const appRouter = router({
  system: systemRouter,
  admin: router({
    status: publicProcedure.query(({ ctx }) => ({ authenticated: hasOwnerSession(ctx.req) })),
    login: publicProcedure.input(z.object({ email: z.string().email().max(320), password: z.string().min(1).max(512) })).mutation(({ ctx, input }) => {
      if (!verifyOwnerCredentials(input.email, input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      ctx.res.cookie(OWNER_ADMIN_COOKIE, createOwnerSession(input.email), { ...getSessionCookieOptions(ctx.req), sameSite: "lax", maxAge: OWNER_SESSION_MAX_AGE_MS });
      return { authenticated: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(OWNER_ADMIN_COOKIE, { ...getSessionCookieOptions(ctx.req), sameSite: "lax", maxAge: -1 });
      return { authenticated: false } as const;
    }),
  }),
  catalog: router({
    list: publicProcedure.query(() => listPublicCatalog()),
    createAlbum: ownerProcedure.input(z.object({ title: z.string().min(1).max(255), coverImage: catalogImageUrl, vinylImage: catalogImageUrl.optional(), releaseYear: z.number().int().min(1000).max(9999).optional(), sortOrder: z.number().int().optional() })).mutation(({ input }) => createCatalogAlbum(input)),
    updateAlbum: ownerProcedure.input(z.object({ id: z.number().int().positive(), title: z.string().min(1).max(255), coverImage: catalogImageUrl, vinylImage: catalogImageUrl.optional(), releaseYear: z.number().int().min(1000).max(9999).optional(), sortOrder: z.number().int().optional() })).mutation(({ input }) => updateCatalogAlbum(input)),
    deleteAlbum: ownerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCatalogAlbum(input.id)),
    createTrack: ownerProcedure.input(catalogTrackInput.extend({ albumId: z.number().int().positive(), sortOrder: z.number().int().optional() })).mutation(({ input }) => createCatalogTrack(input)),
    updateTrack: ownerProcedure.input(catalogTrackInput.extend({ id: z.number().int().positive(), sortOrder: z.number().int().optional() })).mutation(({ input }) => updateCatalogTrack(input)),
    deleteTrack: ownerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCatalogTrack(input.id)),
    reorderTracks: ownerProcedure.input(z.object({ albumId: z.number().int().positive(), trackIds: z.array(z.number().int().positive()).min(1).refine((ids) => new Set(ids).size === ids.length, "Track IDs must be unique.") })).mutation(({ input }) => reorderCatalogTracks(input.albumId, input.trackIds)),
    fetchMp3Metadata: ownerProcedure.input(z.object({ audioUrl: z.string().url().max(2048) })).mutation(({ input }) => readMp3Metadata(input.audioUrl)),
    fetchLrc: publicProcedure.input(z.object({ lrcUrl: z.string().url().max(2048) })).mutation(({ input }) => readLrc(input.lrcUrl)),
  }),
});

export type AppRouter = typeof appRouter;
