// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Search,
  ExternalLink,
  Compass,
  Car,
  Footprints,
  X,
  Building2,
  Sparkles,
  Bed,
  Bath,
  Maximize2,
} from 'lucide-react';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface MapPropertyItem {
  id: string | number;
  title: string;
  subtitle?: string;
  locationQuery: string;
  priceDisplay?: string;
  priceLabel?: string;
  type?: string;
  categoryLabel?: string;
  status?: string;
  statusLabel?: string;
  beds?: number | null;
  baths?: number | null;
  area?: number | null;
  href?: string;
  imageUrl?: string | null;
}

export type MapListingItem = MapPropertyItem;

interface ResolvedPinItem extends MapPropertyItem {
  id: string;
  position: LatLngLiteral;
  formattedAddress?: string;
  googleMapsURI?: string;
  placeId?: string;
}

interface NearbyPlaceItem {
  id: string;
  displayName: string;
  formattedAddress: string;
  position: LatLngLiteral;
  rating?: number | null;
  userRatingCount?: number | null;
  googleMapsURI?: string | null;
  category: string;
}

interface PlaceSuggestionItem {
  placePrediction?: {
    text?: { text?: string };
    toPlace: () => {
      fetchFields: (opts: { fields: string[] }) => Promise<void>;
      displayName?: string;
      formattedAddress?: string;
      location?: {
        lat: number | (() => number);
        lng: number | (() => number);
      };
      viewport?: unknown;
      googleMapsURI?: string;
    };
  };
}

interface PolylineLike {
  setOptions: (opts: Record<string, unknown>) => void;
  setMap: (map: unknown) => void;
}

const ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

const DEFAULT_OFFICE_ITEMS: MapPropertyItem[] = [
  {
    id: 'office-wak',
    title: 'Attaie Properties Headquarters — Wazir Akbar Khan',
    locationQuery: 'Street 13, Wazir Akbar Khan, Kabul, Afghanistan',
    priceDisplay: 'Main Corporate Office',
    type: 'Headquarters',
    status: 'Open Sat–Thu 8AM–6PM',
    href: '/contact',
  },
  {
    id: 'office-shahr-e-naw',
    title: 'Attaie Properties — Shahr-e-Naw Client Advisory Desk',
    locationQuery: 'Shahr-e-Naw Park Road, Kabul, Afghanistan',
    priceDisplay: 'Sales & Leasing Lounge',
    type: 'Branch Office',
    status: 'Open Sat–Thu 8AM–6PM',
    href: '/contact',
  },
  {
    id: 'office-karte-char',
    title: 'Attaie Properties — Karte Char West Kabul Desk',
    locationQuery: 'Karte Char, Kabul, Afghanistan',
    priceDisplay: 'Residential & Development Desk',
    type: 'Branch Office',
    status: 'Open Sat–Thu 9AM–5PM',
    href: '/contact',
  },
];

function resolveGoogleMapsApiKey(): string {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const procEnv =
    typeof process !== 'undefined'
      ? (process as unknown as { env?: Record<string, string | undefined> }).env
      : undefined;

  return (
    metaEnv?.VITE_GOOGLE_MAPS_API_KEY ||
    metaEnv?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    procEnv?.GOOGLE_MAPS_PLATFORM_KEY ||
    ''
  );
}

function checkAndDispatchQuotaError(err: unknown): void {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  if (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('429')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

const NEARBY_CATEGORIES = [
  { id: 'school', label: 'Schools & Universities', query: 'schools and universities' },
  { id: 'hospital', label: 'Hospitals & Clinics', query: 'hospitals and medical clinics' },
  { id: 'bank', label: 'Banks & ATMs', query: 'banks and financial services' },
  { id: 'supermarket', label: 'Supermarkets', query: 'supermarkets and shopping' },
  { id: 'restaurant', label: 'Restaurants & Cafes', query: 'restaurants and cafes' },
];

/**
 * Reusable AdvancedMarker + anchored InfoWindow component following @vis.gl/react-google-maps patterns.
 * Reference: https://developers.google.com/maps/documentation/javascript/advanced-markers/overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio
 */
const ListingAdvancedMarker: React.FC<{
  item: ResolvedPinItem;
  isSelected: boolean;
  onSelect: (item: ResolvedPinItem) => void;
  onClose: () => void;
  onSetDestination: (destinationQuery: string, label: string) => void;
}> = ({ item, isSelected, onSelect, onClose, onSetDestination }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const displayCategory = item.type || item.categoryLabel;
  const displayStatus = item.status || item.statusLabel;
  const displayPrice = item.priceDisplay || item.priceLabel;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={item.position}
        title={item.title}
        onClick={() => onSelect(item)}
      >
        <Pin
          background={isSelected ? '#0145F2' : '#020E3A'}
          borderColor={isSelected ? '#FFFFFF' : '#0145F2'}
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.25 : 1.05}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} maxWidth={310} onCloseClick={onClose}>
          <div className="p-1 text-brand-navy font-sans">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-28 object-cover rounded-lg mb-2"
                loading="lazy"
              />
            )}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {displayCategory && (
                <span className="px-2 py-0.5 rounded-md bg-brand-navy text-white text-[10px] font-bold uppercase tracking-wider">
                  {displayCategory}
                </span>
              )}
              {displayStatus && (
                <span className="px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-[10px] font-bold uppercase">
                  {displayStatus}
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-brand-navy leading-snug mb-1">{item.title}</h4>
            {displayPrice && (
              <p className="text-xs font-extrabold text-brand-gold mb-1">{displayPrice}</p>
            )}
            {(item.beds != null || item.baths != null || item.area != null) && (
              <div className="flex items-center gap-3 text-[11px] font-semibold text-neutral-600 mb-1.5">
                {item.beds != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bed size={12} className="text-brand-gold" />
                    {item.beds}
                  </span>
                )}
                {item.baths != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bath size={12} className="text-brand-gold" />
                    {item.baths}
                  </span>
                )}
                {item.area != null && (
                  <span className="inline-flex items-center gap-1">
                    <Maximize2 size={11} className="text-brand-gold" />
                    {item.area} m²
                  </span>
                )}
              </div>
            )}
            <p className="text-[11px] text-neutral-600 mb-2">
              {item.formattedAddress || item.locationQuery}
            </p>
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-neutral-200">
              {item.href && (
                <Link
                  to={item.href}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-navy text-white text-[11px] font-semibold hover:bg-brand-gold transition-colors"
                >
                  <span>View Details</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() =>
                  onSetDestination(item.formattedAddress || item.locationQuery, item.title)
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-gold/15 text-brand-gold text-[11px] font-semibold hover:bg-brand-gold hover:text-white transition-colors cursor-pointer"
              >
                <Navigation size={11} />
                <span>Directions</span>
              </button>
              {item.googleMapsURI && (
                <a
                  href={item.googleMapsURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-brand-navy ml-auto"
                >
                  <span>Google Maps</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const NearbyAdvancedMarker: React.FC<{
  place: NearbyPlaceItem;
  isSelected: boolean;
  onSelect: (place: NearbyPlaceItem) => void;
  onClose: () => void;
}> = ({ place, isSelected, onSelect, onClose }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.position}
        title={place.displayName}
        onClick={() => onSelect(place)}
      >
        <Pin
          background="#059669"
          borderColor="#FFFFFF"
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.15 : 0.95}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={onClose}>
          <div className="p-1 text-brand-navy font-sans">
            <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase mb-1">
              {place.category}
            </span>
            <h4 className="text-xs font-bold text-brand-navy mb-0.5">{place.displayName}</h4>
            <p className="text-[11px] text-neutral-600 mb-1.5">{place.formattedAddress}</p>
            {place.rating != null && (
              <p className="text-[11px] font-semibold text-amber-600 mb-1.5">
                ★ {place.rating.toFixed(1)}{' '}
                {place.userRatingCount ? `(${place.userRatingCount} reviews)` : ''}
              </p>
            )}
            {place.googleMapsURI && (
              <a
                href={place.googleMapsURI}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-gold hover:underline"
              >
                <span>View on Google Maps</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

/**
 * Inner controller that uses @vis.gl/react-google-maps hooks (`useMap`, `useMapsLibrary`)
 * to resolve listing coordinates via `Place.searchByText`, provide Places Autocomplete with
 * `AutocompleteSessionToken`, search nearby amenities, and calculate routes via `Route.computeRoutes`.
 */
const MapWorkspaceInner: React.FC<{
  items: MapPropertyItem[];
  defaultRegionQuery: string;
  showNearbyExplorer: boolean;
  showRoutePlanner: boolean;
  heightClassName: string;
}> = ({
  items,
  defaultRegionQuery,
  showNearbyExplorer,
  showRoutePlanner,
  heightClassName,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places') as unknown as {
    Place: {
      searchByText: (req: Record<string, unknown>) => Promise<{
        places?: Array<{
          id?: string;
          displayName?: string;
          formattedAddress?: string;
          location?: {
            lat: number | (() => number);
            lng: number | (() => number);
          };
          viewport?: unknown;
          rating?: number | null;
          userRatingCount?: number | null;
          googleMapsURI?: string | null;
        }>;
      }>;
    };
    AutocompleteSessionToken: new () => unknown;
    AutocompleteSuggestion: {
      fetchAutocompleteSuggestions: (
        req: Record<string, unknown>
      ) => Promise<{ suggestions?: PlaceSuggestionItem[] }>;
    };
  } | null;

  const routesLib = useMapsLibrary('routes') as unknown as {
    Route: {
      computeRoutes: (req: Record<string, unknown>) => Promise<{
        routes?: Array<{
          distanceMeters?: number;
          durationMillis?: number;
          viewport?: unknown;
          createPolylines?: () => PolylineLike[];
        }>;
      }>;
    };
  } | null;

  const coreLib = useMapsLibrary('core') as unknown as {
    LatLngBounds: new () => {
      extend: (pos: LatLngLiteral) => void;
    };
  } | null;

  const [resolvedPins, setResolvedPins] = useState<ResolvedPinItem[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [resolvingLocations, setResolvingLocations] = useState(false);
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);

  // Places Autocomplete state (AutocompleteSuggestion.fetchAutocompleteSuggestions + AutocompleteSessionToken)
  // Reference: https://developers.google.com/maps/documentation/javascript/place-autocomplete-data?utm_campaign=gmp_mcp_codeassist_v1_aistudio
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestionItem[]>([]);
  const [searchedPlacePin, setSearchedPlacePin] = useState<{
    title: string;
    address: string;
    position: LatLngLiteral;
    uri?: string | null;
  } | null>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const placeCacheRef = useRef<Record<string, ResolvedPinItem>>({});

  // Nearby Places (Place.searchByText)
  const [activeNearbyCat, setActiveNearbyCat] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);
  const [selectedNearbyId, setSelectedNearbyId] = useState<string | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Modern Route Calculator state (Route.computeRoutes)
  // Reference: https://developers.google.com/maps/documentation/javascript/routes?utm_campaign=gmp_mcp_codeassist_v1_aistudio
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [routeSummary, setRouteSummary] = useState<{
    distanceKm: string;
    durationMins: number;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const polylinesRef = useRef<PolylineLike[]>([]);

  // Resolve initial region viewport and listing markers dynamically via Places API (New) `Place.searchByText`
  useEffect(() => {
    if (!placesLib || !map) return;
    let cancelled = false;

    const resolveAll = async () => {
      setResolvingLocations(true);
      const { Place } = placesLib;
      const resolved: ResolvedPinItem[] = [];

      // 1. Resolve each listing item via Places API (New) Text Search
      for (const item of items) {
        const stringId = String(item.id);
        const cacheKey = `${stringId}::${item.locationQuery}`;
        if (placeCacheRef.current[cacheKey]) {
          resolved.push(placeCacheRef.current[cacheKey]);
          continue;
        }

        const queryText = item.locationQuery.toLowerCase().includes('kabul')
          ? item.locationQuery
          : `${item.locationQuery}, Kabul, Afghanistan`;

        try {
          const { places } = await Place.searchByText({
            textQuery: queryText,
            fields: ['id', 'displayName', 'formattedAddress', 'location', 'googleMapsURI'],
            maxResultCount: 1,
            internalUsageAttributionIds: [ATTRIBUTION_ID],
          });

          const first = places?.[0];
          if (first?.location) {
            const lat =
              typeof first.location.lat === 'function'
                ? first.location.lat()
                : Number(first.location.lat);
            const lng =
              typeof first.location.lng === 'function'
                ? first.location.lng()
                : Number(first.location.lng);

            // Slight deterministic offset if multiple listings share the exact same street center
            const offsetIdx = resolved.length;
            const jitterLat = offsetIdx > 0 ? ((offsetIdx % 3) - 1) * 0.0006 : 0;
            const jitterLng = offsetIdx > 0 ? (((offsetIdx + 1) % 3) - 1) * 0.0006 : 0;

            const pinItem: ResolvedPinItem = {
              ...item,
              id: stringId,
              position: { lat: lat + jitterLat, lng: lng + jitterLng },
              formattedAddress: first.formattedAddress || item.locationQuery,
              googleMapsURI: first.googleMapsURI || undefined,
              placeId: first.id,
            };
            placeCacheRef.current[cacheKey] = pinItem;
            resolved.push(pinItem);
          }
        } catch (err) {
          checkAndDispatchQuotaError(err);
        }
      }

      if (cancelled) return;
      setResolvedPins(resolved);
      setResolvingLocations(false);

      if (resolved.length === 1) {
        map.panTo(resolved[0].position);
        map.setZoom(15);
        setSelectedPinId(resolved[0].id);
        setDestinationQuery(resolved[0].formattedAddress || resolved[0].locationQuery);
        setDestinationLabel(resolved[0].title);
      } else if (resolved.length > 1 && coreLib) {
        const bounds = new coreLib.LatLngBounds();
        resolved.forEach((p) => bounds.extend(p.position));
        map.fitBounds(bounds as unknown as Parameters<typeof map.fitBounds>[0], 64);
        setDestinationQuery(resolved[0].formattedAddress || resolved[0].locationQuery);
        setDestinationLabel(resolved[0].title);
      } else {
        // Fallback: resolve the default region query via Places API (New)
        try {
          const { places } = await Place.searchByText({
            textQuery: defaultRegionQuery,
            fields: ['location', 'viewport'],
            maxResultCount: 1,
            internalUsageAttributionIds: [ATTRIBUTION_ID],
          });
          const regionPlace = places?.[0];
          if (regionPlace?.viewport) {
            map.fitBounds(regionPlace.viewport as unknown as Parameters<typeof map.fitBounds>[0]);
          } else if (regionPlace?.location) {
            const lat =
              typeof regionPlace.location.lat === 'function'
                ? regionPlace.location.lat()
                : Number(regionPlace.location.lat);
            const lng =
              typeof regionPlace.location.lng === 'function'
                ? regionPlace.location.lng()
                : Number(regionPlace.location.lng);
            map.panTo({ lat, lng });
            map.setZoom(13);
          }
        } catch (err) {
          checkAndDispatchQuotaError(err);
        }
      }
    };

    void resolveAll();
    return () => {
      cancelled = true;
    };
  }, [placesLib, coreLib, map, items, defaultRegionQuery]);

  // Autocomplete suggestions using `AutocompleteSuggestion.fetchAutocompleteSuggestions`
  useEffect(() => {
    if (!placesLib) return;
    const trimmed = searchInput.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const timer = setTimeout(() => {
      const request: Record<string, unknown> = {
        input: trimmed,
        region: 'af',
        sessionToken: sessionTokenRef.current,
      };

      AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        .then((res: { suggestions?: PlaceSuggestionItem[] }) => {
          setSuggestions(res?.suggestions || []);
        })
        .catch((err: unknown) => {
          checkAndDispatchQuotaError(err);
          setSuggestions([]);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [placesLib, searchInput]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: PlaceSuggestionItem) => {
      if (!placesLib || !map || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'googleMapsURI'],
        });

        // Reset session token after fetchFields per Google Maps Platform billing best practices
        sessionTokenRef.current = null;
        setSuggestions([]);
        setSearchInput(place.displayName || suggestion.placePrediction.text?.text || '');

        if (place.viewport) {
          map.fitBounds(place.viewport as unknown as Parameters<typeof map.fitBounds>[0]);
        } else if (place.location) {
          const lat =
            typeof place.location.lat === 'function'
              ? place.location.lat()
              : Number(place.location.lat);
          const lng =
            typeof place.location.lng === 'function'
              ? place.location.lng()
              : Number(place.location.lng);
          map.panTo({ lat, lng });
          map.setZoom(15);
        }

        if (place.location) {
          const lat =
            typeof place.location.lat === 'function'
              ? place.location.lat()
              : Number(place.location.lat);
          const lng =
            typeof place.location.lng === 'function'
              ? place.location.lng()
              : Number(place.location.lng);

          setSearchedPlacePin({
            title: place.displayName || 'Selected Location',
            address: place.formattedAddress || '',
            position: { lat, lng },
            uri: place.googleMapsURI,
          });
          if (!originQuery) {
            setOriginQuery(place.formattedAddress || place.displayName || '');
          }
        }
      } catch (err) {
        checkAndDispatchQuotaError(err);
      }
    },
    [placesLib, map, originQuery]
  );

  // Nearby Places Explorer using `Place.searchByText`
  const handleNearbyCategoryClick = async (categoryId: string, queryTerm: string, label: string) => {
    if (!placesLib || !map) return;
    if (activeNearbyCat === categoryId) {
      setActiveNearbyCat(null);
      setNearbyPlaces([]);
      setSelectedNearbyId(null);
      return;
    }

    setActiveNearbyCat(categoryId);
    setLoadingNearby(true);
    setSelectedNearbyId(null);

    try {
      const { Place } = placesLib;
      const centerContext =
        resolvedPins[0]?.formattedAddress || defaultRegionQuery || 'Kabul, Afghanistan';
      const { places } = await Place.searchByText({
        textQuery: `${queryTerm} near ${centerContext}`,
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'userRatingCount',
          'googleMapsURI',
        ],
        maxResultCount: 6,
        internalUsageAttributionIds: [ATTRIBUTION_ID],
      });

      const mapped: NearbyPlaceItem[] = [];
      for (const p of places || []) {
        if (!p.location) continue;
        const lat = typeof p.location.lat === 'function' ? p.location.lat() : Number(p.location.lat);
        const lng = typeof p.location.lng === 'function' ? p.location.lng() : Number(p.location.lng);
        mapped.push({
          id: p.id || `${lat}_${lng}`,
          displayName: p.displayName || label,
          formattedAddress: p.formattedAddress || '',
          position: { lat, lng },
          rating: p.rating,
          userRatingCount: p.userRatingCount,
          googleMapsURI: p.googleMapsURI,
          category: label,
        });
      }
      setNearbyPlaces(mapped);
    } catch (err) {
      checkAndDispatchQuotaError(err);
      setNearbyPlaces([]);
    } finally {
      setLoadingNearby(false);
    }
  };

  // Modern Route calculation using `Route.computeRoutes` via `useMapsLibrary('routes')`
  const handleComputeRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routesLib || !map || !originQuery.trim() || !destinationQuery.trim()) return;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    setRouteError(null);
    setRouteSummary(null);
    setRouteLoading(true);

    const originFormatted = originQuery.toLowerCase().includes('kabul')
      ? originQuery.trim()
      : `${originQuery.trim()}, Kabul, Afghanistan`;
    const destFormatted = destinationQuery.toLowerCase().includes('kabul')
      ? destinationQuery.trim()
      : `${destinationQuery.trim()}, Kabul, Afghanistan`;

    try {
      const response = await routesLib.Route.computeRoutes({
        origin: originFormatted,
        destination: destFormatted,
        travelMode,
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      });

      const primaryRoute = response?.routes?.[0];
      if (!primaryRoute) {
        setRouteError('Could not find a route between these locations.');
        setRouteLoading(false);
        return;
      }

      if (typeof primaryRoute.createPolylines === 'function') {
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#0145F2',
            strokeWeight: 5,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;
      }

      if (primaryRoute.viewport) {
        map.fitBounds(primaryRoute.viewport as unknown as Parameters<typeof map.fitBounds>[0]);
      }

      const distMeters = Number(primaryRoute.distanceMeters || 0);
      const durMillis = Number(primaryRoute.durationMillis || 0);
      setRouteSummary({
        distanceKm: (distMeters / 1000).toFixed(1),
        durationMins: Math.max(1, Math.round(durMillis / 60000)),
      });
    } catch (err) {
      checkAndDispatchQuotaError(err);
      setRouteError('Unable to calculate route. Please refine the origin or destination address.');
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    setRouteSummary(null);
    setRouteError(null);
  };

  useEffect(() => {
    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-brand-navy/10 overflow-hidden shadow-brand-md">
      {/* Top Interactive Controls Bar */}
      <div className="p-4 bg-brand-navy text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
            <Compass size={18} className="text-brand-gold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
              <span>Interactive Google Map & Neighborhood Explorer</span>
              {resolvedPins.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-gold text-white text-[11px] font-bold">
                  {resolvedPins.length} {resolvedPins.length === 1 ? 'Property Marker' : 'Property Markers'}
                </span>
              )}
              {resolvingLocations && (
                <span className="text-[11px] font-normal text-white/60">
                  • Locating pins…
                </span>
              )}
            </h3>
            <p className="text-xs text-white/65">
              Search Kabul neighborhoods, inspect property pins, explore nearby amenities, or calculate commute times
            </p>
          </div>
        </div>

        {/* Places Autocomplete Search Input */}
        <div className="relative w-full lg:w-80">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search place or street in Kabul…"
            aria-label="Search place on Google Maps"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-brand-gold"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSuggestions([]);
                setSearchedPlacePin(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}

          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1.5 bg-white text-brand-navy rounded-xl shadow-xl border border-neutral-200 z-30 max-h-60 overflow-y-auto divide-y divide-neutral-100">
              {suggestions.map((s, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => void handleSelectSuggestion(s)}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-brand-ivory transition-colors flex items-start gap-2 cursor-pointer"
                  >
                    <MapPin size={14} className="text-brand-gold shrink-0 mt-0.5" />
                    <span className="line-clamp-2 font-medium">
                      {s.placePrediction?.text?.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Nearby Neighborhood Categories Bar */}
      {showNearbyExplorer && (
        <div className="px-4 py-2.5 bg-brand-ivory border-b border-neutral-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-brand-gold" />
            Nearby Places:
          </span>
          {NEARBY_CATEGORIES.map((cat) => {
            const active = activeNearbyCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => void handleNearbyCategoryClick(cat.id, cat.query, cat.label)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  active
                    ? 'bg-brand-gold text-white shadow-xs'
                    : 'bg-white text-brand-navy border border-neutral-200 hover:border-brand-gold'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
          {loadingNearby && (
            <span className="text-xs text-neutral-500 ml-2 shrink-0">Searching Places API…</span>
          )}
        </div>
      )}

      {/* Map Viewport (Explicit height prevents CF2 0x0 collapse) */}
      <div className={`relative w-full ${heightClassName}`}>
        {/* Skeleton loading overlay until map is fully initialized */}
        {(!map || !mapTilesLoaded || resolvingLocations) && (
          <div
            className="absolute inset-0 z-20 bg-brand-ivory flex flex-col justify-between p-6 pointer-events-none animate-pulse overflow-hidden"
            aria-label="Loading interactive map"
            role="status"
          >
            {/* Top controls skeleton */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-300" />
                <div className="space-y-1.5">
                  <div className="w-36 h-3.5 bg-neutral-300 rounded" />
                  <div className="w-48 h-2.5 bg-neutral-200 rounded" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-20 h-8 bg-neutral-200 rounded-lg" />
                <div className="w-24 h-8 bg-neutral-300 rounded-lg" />
              </div>
            </div>

            {/* Center simulated map pins & grid lines */}
            <div className="relative flex-1 my-6 rounded-xl border border-dashed border-neutral-300/80 flex items-center justify-center">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px opacity-30">
                <div className="border-r border-b border-neutral-300" />
                <div className="border-r border-b border-neutral-300" />
                <div className="border-b border-neutral-300" />
                <div className="border-r border-b border-neutral-300" />
                <div className="border-r border-b border-neutral-300" />
                <div className="border-b border-neutral-300" />
                <div className="border-r border-neutral-300" />
                <div className="border-r border-neutral-300" />
                <div />
              </div>

              {/* Pulsing center marker indicator */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white/80 backdrop-blur-xs px-5 py-3.5 rounded-2xl border border-white/60 shadow-brand-sm">
                <div className="w-10 h-10 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center animate-bounce">
                  <MapPin size={22} className="text-brand-gold" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-brand-navy">Initializing Kabul Map</p>
                  <p className="text-[11px] text-neutral-500">Loading properties and spatial coordinates…</p>
                </div>
              </div>

              {/* Simulated floating pins in map space */}
              <div className="absolute top-1/4 left-1/4 w-7 h-7 rounded-full bg-neutral-300 shadow-xs flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-brand-navy/30" />
              </div>
              <div className="absolute bottom-1/3 right-1/4 w-7 h-7 rounded-full bg-neutral-300 shadow-xs flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-brand-gold/40" />
              </div>
              <div className="absolute top-1/3 right-1/3 w-6 h-6 rounded-full bg-neutral-200" />
            </div>

            {/* Bottom listing pill skeleton */}
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-40 h-8 bg-neutral-300 rounded-xl shrink-0" />
              <div className="w-44 h-8 bg-neutral-200 rounded-xl shrink-0 hidden sm:block" />
              <div className="w-36 h-8 bg-neutral-200 rounded-xl shrink-0 hidden md:block" />
            </div>
          </div>
        )}

        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: 0, lng: 0 }}
          defaultZoom={2}
          gestureHandling="greedy"
          internalUsageAttributionIds={[ATTRIBUTION_ID]}
          onTilesLoaded={() => setMapTilesLoaded(true)}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Property / Project / Branch Pins */}
          {resolvedPins.map((pin) => (
            <ListingAdvancedMarker
              key={pin.id}
              item={pin}
              isSelected={selectedPinId === pin.id}
              onSelect={(item) => {
                setSelectedPinId(item.id);
                setDestinationQuery(item.formattedAddress || item.locationQuery);
                setDestinationLabel(item.title);
              }}
              onClose={() => setSelectedPinId(null)}
              onSetDestination={(dest, label) => {
                setDestinationQuery(dest);
                setDestinationLabel(label);
              }}
            />
          ))}

          {/* Nearby Amenity Pins */}
          {nearbyPlaces.map((place) => (
            <NearbyAdvancedMarker
              key={place.id}
              place={place}
              isSelected={selectedNearbyId === place.id}
              onSelect={(p) => setSelectedNearbyId(p.id)}
              onClose={() => setSelectedNearbyId(null)}
            />
          ))}

          {/* User Autocomplete Searched Pin */}
          {searchedPlacePin && (
            <AdvancedMarker
              position={searchedPlacePin.position}
              title={searchedPlacePin.title}
            >
              <Pin background="#D97706" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.15} />
            </AdvancedMarker>
          )}
        </GoogleMap>

        {/* Quick Listing Selector Pills Overlay */}
        {resolvedPins.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 overflow-x-auto pb-1">
            {resolvedPins.map((pin) => {
              const active = selectedPinId === pin.id;
              const priceText = pin.priceDisplay || pin.priceLabel;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => {
                    setSelectedPinId(pin.id);
                    map?.panTo(pin.position);
                    map?.setZoom(15);
                    setDestinationQuery(pin.formattedAddress || pin.locationQuery);
                    setDestinationLabel(pin.title);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-brand-gold text-white'
                      : 'bg-white/95 backdrop-blur-xs text-brand-navy hover:bg-brand-navy hover:text-white'
                  }`}
                >
                  <Building2 size={13} />
                  <span className="max-w-[180px] truncate">{pin.title}</span>
                  {priceText && (
                    <span className="opacity-80 font-extrabold">· {priceText}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Routes API Commute & Directions Bar */}
      {showRoutePlanner && (
        <form
          onSubmit={handleComputeRoute}
          className="p-4 bg-brand-cream border-t border-neutral-200 flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-brand-navy shrink-0">
            <Navigation size={15} className="text-brand-gold" />
            <span>Route & Commute Calculator:</span>
          </div>

          <input
            type="text"
            value={originQuery}
            onChange={(e) => setOriginQuery(e.target.value)}
            placeholder="Origin (e.g. Kabul International Airport, Shahr-e-Naw…)"
            className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs text-brand-navy focus:outline-none focus:border-brand-gold"
          />

          <input
            type="text"
            value={destinationQuery}
            onChange={(e) => setDestinationQuery(e.target.value)}
            placeholder="Destination property or branch…"
            title={destinationLabel || 'Destination'}
            className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs text-brand-navy focus:outline-none focus:border-brand-gold"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setTravelMode('DRIVING')}
              className={`px-2.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                travelMode === 'DRIVING'
                  ? 'bg-brand-navy text-white'
                  : 'bg-white text-neutral-600 border border-neutral-300'
              }`}
              title="Driving route"
            >
              <Car size={13} />
              <span>Drive</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('WALKING')}
              className={`px-2.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                travelMode === 'WALKING'
                  ? 'bg-brand-navy text-white'
                  : 'bg-white text-neutral-600 border border-neutral-300'
              }`}
              title="Walking route"
            >
              <Footprints size={13} />
              <span>Walk</span>
            </button>
            <button
              type="submit"
              disabled={routeLoading || !originQuery.trim() || !destinationQuery.trim()}
              className="px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {routeLoading ? 'Routing…' : 'Get Route'}
            </button>
            {routeSummary && (
              <button
                type="button"
                onClick={clearRoute}
                className="px-2.5 py-2 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {routeSummary && (
            <div className="px-3 py-1.5 rounded-xl bg-brand-gold/15 border border-brand-gold/30 text-brand-navy text-xs font-bold shrink-0">
              {routeSummary.distanceKm} km • ~{routeSummary.durationMins} mins
            </div>
          )}

          {routeError && (
            <div className="text-xs text-red-600 font-medium">{routeError}</div>
          )}
        </form>
      )}
    </div>
  );
};

export interface AttaieGoogleMapProps {
  mode?: 'single-property' | 'multi-property' | 'office';
  items?: MapPropertyItem[];
  defaultRegionQuery?: string;
  showNearbyExplorer?: boolean;
  showNeighborhoodTools?: boolean;
  showRoutePlanner?: boolean;
  showDirections?: boolean;
  heightClassName?: string;
  heightClass?: string;
}

export const AttaieGoogleMap: React.FC<AttaieGoogleMapProps> = ({
  mode = 'multi-property',
  items,
  defaultRegionQuery = 'Wazir Akbar Khan, Kabul, Afghanistan',
  showNearbyExplorer,
  showNeighborhoodTools,
  showRoutePlanner,
  showDirections,
  heightClassName,
  heightClass,
}) => {
  const apiKey = resolveGoogleMapsApiKey();
  const effectiveItems =
    items && items.length > 0
      ? items
      : mode === 'office'
      ? DEFAULT_OFFICE_ITEMS
      : [];

  const effectiveNearby = showNeighborhoodTools ?? showNearbyExplorer ?? true;
  const effectiveDirections = showDirections ?? showRoutePlanner ?? true;
  const effectiveHeight = heightClass ?? heightClassName ?? 'h-[460px]';

  return (
    <APIProvider apiKey={apiKey} language="en" region="AF">
      <MapWorkspaceInner
        items={effectiveItems}
        defaultRegionQuery={defaultRegionQuery}
        showNearbyExplorer={effectiveNearby}
        showRoutePlanner={effectiveDirections}
        heightClassName={effectiveHeight}
      />
    </APIProvider>
  );
};
