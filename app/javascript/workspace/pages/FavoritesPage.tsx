import { useNavigate } from 'react-router-dom';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { formatCurrency } from '../utils/formatters';
import type { FavoriteItem } from '../types';

interface FavoriteCardProps {
  item: FavoriteItem;
  onUnfavorite: () => void;
  onClick: () => void;
}

function FavoriteCard({ item, onUnfavorite, onClick }: FavoriteCardProps) {
  const isContractor = item.item_type === 'contractor';

  return (
    <div
      className="group rounded-xl border border-neutral-200 bg-white overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
        {isContractor ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        ) : item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Favorite button - always visible since this is favorites page */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnfavorite();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm text-rose-500 hover:text-rose-600 transition-colors"
          title="Usuń z ulubionych"
        >
          <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* External link indicator */}
        {item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Otwórz link"
          >
            <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">
          {item.name}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-sm text-neutral-500">
            {formatCurrency(item.total_price)}
          </span>
        </div>
        {/* Project badge */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 truncate max-w-full">
            {item.project_name}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-1">
        Brak ulubionych produktów
      </h3>
      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
        Dodaj produkty do ulubionych klikając ikonę serduszka przy produkcie w projekcie.
      </p>
    </div>
  );
}

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <header className="mb-8">
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 mb-1">
          Kolekcja
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Ulubione produkty
        </h1>
        <p className="text-neutral-500 mt-1">
          Twoje ulubione produkty ze wszystkich projektów
        </p>
      </header>

      {favorites?.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites?.map((item) => (
            <FavoriteCard
              key={item.id}
              item={item}
              onUnfavorite={() => toggleFavorite.mutate({ itemId: item.id, favorite: true })}
              onClick={() => navigate(`/workspace/projects/${item.project_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
