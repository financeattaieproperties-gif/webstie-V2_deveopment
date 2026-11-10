import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Hash,
  X,
  Loader2,
  Bed,
  Bath,
  Maximize2,
  ArrowUpRight,
  Building2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { searchProperties, type Property } from '../../lib/dbService';

export interface SearchBarProps {
  value?: string;
  onChange?: (query: string) => void;
  purpose?: 'buy' | 'rent' | 'commercial';
  onPurposeChange?: (purpose: 'buy' | 'rent' | 'commercial') => void;
  onSearchResults?: (results: Property[], total: number) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  purpose: controlledPurpose,
  onPurposeChange,
  onSearchResults,
  placeholder = 'Search by title, location, or serial number...',
}) => {
  const navigate = useNavigate();
  const [internalPurpose, setInternalPurpose] = useState<'buy' | 'rent' | 'commercial'>('buy');
  const [internalQuery, setInternalQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLFormElement>(null);
  const onSearchResultsRef = useRef(onSearchResults);
  onSearchResultsRef.current = onSearchResults;

  const activePurpose = controlledPurpose ?? internalPurpose;
  const query = value !== undefined ? value : internalQuery;
  const trimmedQuery = query.trim();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch matching properties from the global search API endpoint
  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      setTotalMatches(0);
      setLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(() => {
      searchProperties(trimmedQuery, {
        purpose: activePurpose,
        limit: 8,
        signal: controller.signal,
      })
        .then((response) => {
          setResults(response.results);
          setTotalMatches(response.total);
          setHighlightedIndex(-1);
          onSearchResultsRef.current?.(response.results, response.total);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setResults([]);
          setTotalMatches(0);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 160);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, activePurpose]);

  const handlePurposeClick = (nextPurpose: 'buy' | 'rent' | 'commercial') => {
    setInternalPurpose(nextPurpose);
    onPurposeChange?.(nextPurpose);
  };

  const handleInputChange = (nextVal: string) => {
    setInternalQuery(nextVal);
    onChange?.(nextVal);
    setIsOpen(Boolean(nextVal.trim()));
  };

  const handleSelectProperty = (property: Property) => {
    setIsOpen(false);
    navigate(`/properties/${property.id}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpen && highlightedIndex >= 0 && highlightedIndex < results.length) {
      handleSelectProperty(results[highlightedIndex]);
      return;
    }
    setIsOpen(false);
    if (onChange) {
      onChange(query);
      return;
    }
    const params = new URLSearchParams();
    params.set('purpose', activePurpose);
    if (trimmedQuery) params.set('search', trimmedQuery);
    navigate(`/properties?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const isSerialLike =
    Boolean(trimmedQuery) &&
    /^[a-z0-9-]+$/i.test(trimmedQuery) &&
    (trimmedQuery.includes('-') || /\d/.test(trimmedQuery));

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className="relative w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-2 z-30"
    >
      <div className="flex flex-col md:flex-row gap-2">
        {/* Purpose Toggle */}
        <div className="flex bg-neutral-100 rounded-xl p-1 md:w-auto w-full shrink-0">
          {(['buy', 'rent', 'commercial'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePurposeClick(p)}
              className={`flex-1 md:flex-none px-6 py-3 text-sm font-bold rounded-lg transition-colors capitalize cursor-pointer ${
                activePurpose === p
                  ? 'bg-white text-brand-gold shadow-sm'
                  : 'text-neutral-500 hover:text-brand-navy'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Real-time Search Input */}
        <div className="flex-1 relative flex items-center bg-neutral-50 rounded-xl px-4">
          {isSerialLike ? (
            <Hash size={19} className="text-brand-gold absolute left-4 pointer-events-none" />
          ) : (
            <MapPin size={20} className="text-neutral-400 absolute left-4 pointer-events-none" />
          )}
          <input
            type="text"
            role="combobox"
            aria-expanded={isOpen && Boolean(trimmedQuery)}
            aria-autocomplete="list"
            aria-controls="global-property-search-results"
            aria-label="Search properties by title, location, or serial number"
            placeholder={placeholder}
            value={query}
            onFocus={() => {
              if (trimmedQuery) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full bg-transparent border-none py-3 pl-8 pr-14 text-brand-navy focus:outline-none focus:ring-0 placeholder:text-neutral-400"
          />
          <div className="absolute right-3 flex items-center gap-1">
            {loading && (
              <Loader2
                size={16}
                className="animate-spin text-brand-gold"
                aria-label="Searching properties"
              />
            )}
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  handleInputChange('');
                  setIsOpen(false);
                }}
                className="p-1 rounded-full text-neutral-400 hover:text-brand-navy hover:bg-neutral-200/70 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" size="lg" className="w-full md:w-auto px-8 shrink-0 gap-2 rounded-xl">
          <Search size={20} />
          <span>Search</span>
        </Button>
      </div>

      {/* Live Global Search Results Dropdown */}
      {isOpen && trimmedQuery && (
        <div
          id="global-property-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden z-50 text-left"
        >
          <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>
              {loading
                ? 'Searching properties...'
                : totalMatches > 0
                  ? `Found ${totalMatches} matching ${totalMatches === 1 ? 'property' : 'properties'}`
                  : 'No matching properties'}
            </span>
            <span className="text-[11px] text-neutral-400">
              Matched by title, location, or serial #
            </span>
          </div>

          {results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
              {results.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectProperty(item)}
                    className={`flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors ${
                      isHighlighted ? 'bg-brand-gold/8' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-brand-navy/10 shrink-0 border border-neutral-200/60 flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Building2 size={18} className="text-brand-navy/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {item.serial_number && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-navy text-white shrink-0">
                            {item.serial_number}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize bg-brand-gold/10 text-brand-gold shrink-0">
                          {item.type} · {item.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-brand-navy truncate">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-0.5">
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin size={12} className="text-brand-gold shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </span>
                        {item.beds !== null && (
                          <span className="inline-flex items-center gap-1">
                            <Bed size={12} className="text-neutral-400" />
                            {item.beds}
                          </span>
                        )}
                        {item.baths !== null && (
                          <span className="inline-flex items-center gap-1">
                            <Bath size={12} className="text-neutral-400" />
                            {item.baths}
                          </span>
                        )}
                        {item.area !== null && (
                          <span className="inline-flex items-center gap-1">
                            <Maximize2 size={11} className="text-neutral-400" />
                            {item.area} m²
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <p className="text-sm font-extrabold text-brand-gold whitespace-nowrap">
                        ${Number(item.price).toLocaleString()}
                        {item.listing_type === 'rent' ? '/mo' : ''}
                      </p>
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand-navy/70">
                        View <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            !loading && (
              <div className="px-4 py-6 text-center text-sm text-neutral-500">
                No properties found matching{' '}
                <span className="font-bold text-brand-navy">&ldquo;{trimmedQuery}&rdquo;</span>.
              </div>
            )
          )}
        </div>
      )}
    </form>
  );
};
