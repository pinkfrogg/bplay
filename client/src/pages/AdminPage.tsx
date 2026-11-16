import CuratorCatalogDesk from "@/components/CuratorCatalogDesk";
import PrincessCrown from "@/components/PrincessCrown";
import { type CatalogAlbum } from "@/lib/catalogRoutes";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

export default function AdminPage() {
  const utils = trpc.useUtils();
  const session = trpc.admin.status.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const catalogQuery = trpc.catalog.list.useQuery(undefined, { enabled: session.data?.authenticated === true });
  const login = trpc.admin.login.useMutation();
  const logout = trpc.admin.logout.useMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      await login.mutateAsync({ email, password });
      setPassword("");
      await utils.admin.status.invalidate();
    } catch {
      setMessage("The email or password was not accepted.");
    }
  };

  const signOut = async () => {
    await logout.mutateAsync();
    await utils.admin.status.invalidate();
  };

  if (session.isLoading) return <main className="admin-portal admin-portal--loading"><LoaderCircle aria-label="Checking owner access" className="admin-spinner" size={26} /></main>;

  if (!session.data?.authenticated) return <main className="admin-portal"><section className="admin-login-card" aria-labelledby="admin-login-heading"><div className="admin-login-mark"><PrincessCrown /><span>Private editor</span></div><h1 id="admin-login-heading">Catalog access</h1><p>Sign in to manage sleeves, audio links, and track details. This editor is not linked from the listener pages.</p><form onSubmit={event => void signIn(event)}><label>Email address<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{message && <p className="admin-login-error" role="alert">{message}</p>}<button className="admin-login-button" type="submit" disabled={login.isPending}>{login.isPending ? <LoaderCircle className="admin-spinner" size={15} /> : <KeyRound size={15} />} {login.isPending ? "Checking access" : "Open catalog desk"}</button></form><Link className="admin-listen-link" href="/"><ArrowLeft size={14} /> Return to listening room</Link></section></main>;

  return <main className="admin-portal"><header className="admin-portal-header"><div><div className="admin-login-mark"><ShieldCheck size={21} /><span>Owner-only workspace</span></div><h1>Curator’s catalog desk</h1><p>Manage the private soundtrack catalog without exposing editing tools to listeners.</p></div><div className="admin-portal-actions"><Link className="admin-listen-link" href="/"><ArrowLeft size={14} /> Listening room</Link><button className="admin-logout-button" type="button" disabled={logout.isPending} onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div></header>{catalogQuery.isLoading ? <section className="admin-catalog-loading"><LoaderCircle className="admin-spinner" size={20} /> Opening the catalog…</section> : <CuratorCatalogDesk catalog={(catalogQuery.data ?? []) as CatalogAlbum[]} />}</main>;
}
