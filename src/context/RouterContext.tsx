import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  path: string;
  navigate: (newPath: string) => void;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
  params: {},
  searchParams: new URLSearchParams()
});

function getCleanHashPath(): string {
  const hash = window.location.hash;
  if (!hash || hash === '#/' || hash === '#') return '/';
  const clean = hash.replace(/^#/, '');
  const [pathOnly] = clean.split('?');
  return pathOnly || '/';
}

function getHashSearchParams(): URLSearchParams {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return new URLSearchParams();
  return new URLSearchParams(hash.substring(qIndex + 1));
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return getCleanHashPath();
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return getHashSearchParams();
  });

  useEffect(() => {
    const handleHashChange = () => {
      setPath(getCleanHashPath());
      setSearchParams(getHashSearchParams());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newPath: string) => {
    const targetHash = newPath.startsWith('/') ? `#${newPath}` : `#/${newPath}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setPath(getCleanHashPath());
      setSearchParams(getHashSearchParams());
    }
  };

  // Simple route param extractor (e.g. /flights/:id or /passenger/ticket/:id)
  const extractParams = (currentPath: string): Record<string, string> => {
    const segments = currentPath.split('/').filter(Boolean);
    const params: Record<string, string> = {};

    if (segments[0] === 'flights' && segments[1]) {
      params.flightId = segments[1];
    } else if (segments[0] === 'passenger' && (segments[1] === 'bookings' || segments[1] === 'ticket') && segments[2]) {
      params.bookingId = segments[2];
    }
    return params;
  };

  const params = extractParams(path);

  return (
    <RouterContext.Provider value={{ path, navigate, params, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);
