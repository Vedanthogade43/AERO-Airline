import React from 'react';
import { useRouter } from '../../context/RouterContext';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();
  return <footer className="mt-auto border-t border-slate-800 bg-slate-900 text-slate-300">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <span>© 2026 Aero · Airline booking demo</span>
      <div className="flex gap-5"><button onClick={() => navigate('/flights')} className="hover:text-white">Find a flight</button><button onClick={() => navigate('/manage-booking')} className="hover:text-white">Manage a booking</button></div>
    </div>
  </footer>;
};
