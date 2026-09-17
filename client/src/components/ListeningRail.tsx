import { Search } from "lucide-react";
import HeaderWalkVideo from "@/components/HeaderWalkVideo";
import PrincessCrown from "@/components/PrincessCrown";
import { isCollectionRoute } from "@/lib/brandNavigation";
import type { CatalogSearchSuggestion } from "@/lib/catalogSearch";
import { Link, useLocation } from "wouter";

type ListenerSearchProps = {
  query: string;
  isLoading: boolean;
  suggestions: CatalogSearchSuggestion[];
  message: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onSelect: (suggestion: CatalogSearchSuggestion) => void;
};

export default function ListeningRail({ search }: { search?: ListenerSearchProps }) {
  const [location] = useLocation();
  const wordmark = isCollectionRoute(location)
    ? <p className="wordmark">Studio Pavilion</p>
    : <Link className="wordmark wordmark-link" href="/" aria-label="Return to the movie albums collection">Studio Pavilion</Link>;

  return <aside className="collection-rail"><div className="rail-header-surface"><header className="rail-brand"><span className="rail-header-ornament" aria-hidden="true"><svg viewBox="0 0 580 330" preserveAspectRatio="xMidYMid meet"><g className="rail-header-ornament-skyline" transform="translate(0 8)"><path d="M18 284c12-12 18-24 32-24 8 0 12 8 18 8 7 0 11-14 20-14 9 0 14 12 21 12 7 0 12-20 21-20 9 0 14 14 22 14 9 0 13-26 22-26 9 0 14 20 24 20 9 0 14-10 22-10 9 0 16 13 24 13 8 0 13-18 22-18 10 0 15 23 25 23 9 0 13-10 21-10 8 0 14 12 22 12 9 0 14-22 22-22 10 0 14 17 23 17 9 0 15-13 23-13 8 0 13 9 21 9 8 0 15-16 23-16 10 0 14 18 24 18 8 0 13-9 21-9 8 0 15 11 23 11 8 0 15-17 23-17 10 0 14 14 23 14 9 0 14-9 21-9 8 0 14 9 22 9 9 0 15-14 24-14 8 0 13 10 21 10 9 0 15-15 25-15 8 0 14 8 22 8 8 0 13-10 22-10 9 0 14 11 24 11 8 0 14-15 22-15 9 0 14 11 23 11" /><path d="M25 284v-19l12-8 12 8v19m-8-15v15m-12-15v15m34 0v-26h15v26m-4-19h-7m7 8h-7m36 11v-33h22v33m-11-33v-12m-6 12h12m-20 10h20m-20 8h20m36 15v-27h23v27m-11-27v-10m-6 10h12m27 27v-34h26v34m-13-34v-13m-7 13h14m-23 9h23m-23 9h23m44 16v-30h24v30m-12-30v-12m-7 12h14m-21 9h21m-21 9h21" /><path d="M467 284c6-33 11-53 17-78l7-43 8-56 7 56 8 43 7 78m-30-78h30m-37 35h44m-48 25h52m-57 18h62m-31-119-6-22 8-12 7 12-6 22m-9-26 9-15 9 15m-24 102h34l-6-25h-22Z" /><path d="M453 284h-5m87 0h-5" /></g><g className="rail-header-ornament-birds"><path d="M442 128c5-5 11-5 16 0-5-1-10 1-16 0Zm47 17c5-5 11-5 16 0-5-1-10 1-16 0Zm39-29c5-5 11-5 16 0-5-1-10 1-16 0Z" /></g></svg></span><PrincessCrown className="brand-crown" /><div>{wordmark}<p className="brand-subtitle">Barbara&apos;s Playlist</p></div><HeaderWalkVideo /></header>{search && <section className="rail-search" aria-label="Search the music collection"><form onSubmit={event => { event.preventDefault(); search.onSubmit(); }}><Search size={16} aria-hidden="true" /><input aria-label="Search movies, songs, or album artists" value={search.query} onChange={event => search.onQueryChange(event.target.value)} placeholder="Search movies, songs, artists" autoComplete="off" /></form>{search.query.trim() && <div className="rail-search-results" role="listbox" aria-label="Search suggestions">{search.suggestions.length ? search.suggestions.map(suggestion => <button key={`${suggestion.kind}-${suggestion.albumId}-${suggestion.trackId ?? "album"}`} type="button" className="rail-search-result" role="option" onClick={() => search.onSelect(suggestion)}><span className="rail-search-result-kind">{suggestion.kind}</span><strong>{suggestion.title}</strong><small>{suggestion.detail}</small></button>) : <p className="rail-search-empty">{search.message || "No matching movies, songs, or artists."}</p>}</div>}</section>}</div></aside>;
}
