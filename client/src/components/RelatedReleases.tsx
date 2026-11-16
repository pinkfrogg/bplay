import { type CatalogAlbum, albumPath } from "@/lib/catalogRoutes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useRef } from "react";

export default function RelatedReleases({ albums }: { albums: CatalogAlbum[] }) {
  const railRef = useRef<HTMLDivElement | null>(null);

  if (!albums.length) return null;

  const scroll = (direction: -1 | 1) => {
    railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * 0.8, behavior: "smooth" });
  };

  return <section className="related-releases" aria-labelledby="related-releases-heading">
    <div className="related-releases-heading"><h2 id="related-releases-heading">Related Releases</h2><div><button type="button" aria-label="Scroll related releases left" onClick={() => scroll(-1)}><ChevronLeft size={17} /></button><button type="button" aria-label="Scroll related releases right" onClick={() => scroll(1)}><ChevronRight size={17} /></button></div></div>
    <div className="related-releases-rail" ref={railRef}>
      {albums.map(album => <Link key={album.id} href={albumPath(album.id)} className="album-card album-card-link related-release-card" aria-label={`Open ${album.title}`}>
        <span className="dvd-case"><img src={album.coverImage} alt="" /></span>
        <span className="album-disc"><img src={album.vinylImage ?? album.coverImage} alt="" /><i className="album-disc-grooves" aria-hidden="true" /><i className="album-disc-hole" aria-hidden="true" /></span>
        <span className="album-card-copy"><strong>{album.title}</strong><small>{album.releaseYear ?? "—"}{album.tracks.length ? ` • ${album.tracks.length} ${album.tracks.length === 1 ? "Track" : "Tracks"}` : ""}</small></span>
      </Link>)}
    </div>
  </section>;
}
