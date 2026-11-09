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

  return <aside className="collection-rail"><div className="rail-header-surface"><header className="rail-brand"><PrincessCrown className="brand-crown" /><div>{wordmark}<p className="brand-subtitle">Barbara&apos;s Playlist</p></div><HeaderWalkVideo /></header>{search && <section className="rail-search" aria-label="Search the music collection"><form onSubmit={event => { event.preventDefault(); search.onSubmit(); }}><Search size={16} aria-hidden="true" /><input aria-label="Search movies, songs, or album artists" value={search.query} onChange={event => search.onQueryChange(event.target.value)} placeholder="Search movies, songs, artists" autoComplete="off" /></form>{search.query.trim() && <div className="rail-search-results" role="listbox" aria-label="Search suggestions">{search.suggestions.length ? search.suggestions.map(suggestion => <button key={`${suggestion.kind}-${suggestion.albumId}-${suggestion.trackId ?? "album"}`} type="button" className="rail-search-result" role="option" onClick={() => search.onSelect(suggestion)}><span className="rail-search-result-kind">{suggestion.kind}</span><strong>{suggestion.title}</strong><small>{suggestion.detail}</small></button>) : <p className="rail-search-empty">{search.message || "No matching movies, songs, or artists."}</p>}</div>}</section>}</div></aside>;
}
