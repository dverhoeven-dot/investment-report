import {createClient, type Client} from "@libsql/client";
let client:Client;
export function db() {
 const url=process.env.TURSO_DATABASE_URL;
 if(!url) throw new Error("TURSO_DATABASE_URL ontbreekt.");
 if(process.env.VERCEL && (!url.startsWith("libsql://") && !url.startsWith("https://"))) throw new Error("Vercel vereist een externe database.");
 return client ??= createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
}
export const schema=[
 `CREATE TABLE IF NOT EXISTS portal_users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('employee','viewer')), active INTEGER NOT NULL DEFAULT 1, permissions TEXT NOT NULL DEFAULT '[]', version INTEGER NOT NULL DEFAULT 1)`,
 `CREATE TABLE IF NOT EXISTS portal_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE, expires INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS portal_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS portal_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, target TEXT NOT NULL, action TEXT NOT NULL, at INTEGER NOT NULL)`,
];
