import CollectionGlitter from "@/components/CollectionGlitter";
import ListeningRail from "@/components/ListeningRail";
import PrincessCrown from "@/components/PrincessCrown";
import { albumPath, type CatalogAlbum } from "@/lib/catalogRoutes";
import { catalogSearchPath, catalogSearchSuggestions, findCatalogSearchResult } from "@/lib/catalogSearch";
import { searchSuggestionReserveHeight } from "@/lib/searchLayout";
import { trpc } from "@/lib/trpc";
import { Film } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";

const HERO_ART = "/manus-storage/rosewood-listening-room-hero_eef780b8.jpg";

export default function Home() {
  const catalogQuery = trpc.catalog.list.useQuery();
  const catalog = (catalogQuery.data ?? []) as CatalogAlbum[];
  const trackCount = catalog.reduce((count, album) => count + album.tracks.length, 0);
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const suggestions = useMemo(() => catalogSearchSuggestions(catalog, searchQuery), [catalog, searchQuery]);
  const searchReserveHeight = searchSuggestionReserveHeight(searchQuery, suggestions.length);
  const openSearchResult = (result: Parameters<typeof catalogSearchPath>[0]) => { setSearchQuery(""); setSearchMessage(""); navigate(catalogSearchPath(result)); };
  const searchCollection = () => {
    const result = findCatalogSearchResult(catalog, searchQuery);
    if (!result) { setSearchMessage(searchQuery.trim() ? "No movie, song, or album artist matched that search." : "Enter a movie, song, or album artist to search."); return; }
    openSearchResult(result);
  };

  return <div className="listening-room curated-room"><ListeningRail search={{ query: searchQuery, isLoading: catalogQuery.isLoading, suggestions, message: searchMessage, onQueryChange: value => { setSearchQuery(value); setSearchMessage(""); }, onSubmit: searchCollection, onSelect: openSearchResult }} /><main className="listening-stage"><CollectionGlitter /><img className="stage-atmosphere" src={HERO_ART} alt="" /><header className="stage-header"><div><p className="eyebrow">Barbie movie soundtrack archive / {trackCount} tracks</p><h1>{catalog.length ? "Choose a sleeve" : "The catalog is being arranged."}</h1></div></header><div className="rail-search-reserve" style={{ height: searchReserveHeight }} aria-hidden="true" /><section className="album-section"><div className="album-section-header"><div className="section-heading"><PrincessCrown /><h2>Discography</h2></div></div>{catalogQuery.isLoading ? <div className="album-empty"><Film size={23} /><div><strong>Opening the collection shelf…</strong><span>Loading movie sleeves.</span></div></div> : !catalog.length ? <div className="album-empty"><Film size={23} /><div><strong>The first sleeve is waiting in the wings.</strong><span>The curator has not arranged a sleeve yet.</span></div></div> : <div className="album-grid">{catalog.map(item => <Link key={item.id} href={albumPath(item.id)} className="album-card album-card-link" aria-label={`Open ${item.title}`}><span className="dvd-case"><img src={item.coverImage} alt="" /><i>DVD / SOUNDTRACK</i></span><span className="album-disc"><img src={item.vinylImage ?? item.coverImage} alt="" /><i className="album-disc-grooves" aria-hidden="true" /><i className="album-disc-hole" aria-hidden="true" /></span><span className="album-card-copy"><strong>{item.title}</strong><small>{item.releaseYear ?? "—"} • {item.tracks.length} {item.tracks.length === 1 ? "Track" : "Tracks"}</small></span></Link>)}</div>}</section></main></div>;
}
