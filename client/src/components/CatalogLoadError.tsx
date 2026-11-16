import { AlertCircle, RefreshCw } from "lucide-react";

export default function CatalogLoadError({ message, onRetry, isRetrying = false }: { message: string; onRetry: () => void; isRetrying?: boolean }) {
  return <section className="catalog-load-error" role="alert">
    <div><AlertCircle size={18} /><strong>Unable to load the catalog</strong></div>
    <p>{message}</p>
    <button type="button" onClick={onRetry} disabled={isRetrying}><RefreshCw size={14} /> Retry</button>
  </section>;
}
