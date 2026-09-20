import { getDb } from "./server/db.js";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import 'dotenv/config';

async function seed() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'testuser',
    password: 'testpassword',
    database: 'testdb'
  });

  const [albums] = await connection.execute("SELECT * FROM catalogAlbums");

  if (albums.length < 3) {
      await connection.execute("INSERT INTO catalogAlbums (title, coverImage, releaseYear) VALUES ('Album 1', 'https://picsum.photos/200', 2020)");
      await connection.execute("INSERT INTO catalogAlbums (title, coverImage, releaseYear) VALUES ('Album 2', 'https://picsum.photos/201', 2021)");
      await connection.execute("INSERT INTO catalogAlbums (title, coverImage, releaseYear) VALUES ('Album 3', 'https://picsum.photos/202', 2022)");
      console.log("Seeded database");
  } else {
      console.log("Database already seeded");
  }

  // Related
  await connection.execute("INSERT IGNORE INTO relatedAlbums (albumId, relatedAlbumId) VALUES (1, 2)");
  await connection.execute("INSERT IGNORE INTO relatedAlbums (albumId, relatedAlbumId) VALUES (1, 3)");
  console.log("Seeded related albums");

  await connection.end();
}

seed().catch(console.error);
