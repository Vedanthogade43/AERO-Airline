import React from 'react';

export const AboutPage: React.FC = () => <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
  <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
    <p className="text-sm font-semibold uppercase tracking-wider text-sky-600">About Aero</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">A simpler way to plan your trip</h1>
    <p className="mt-5 max-w-2xl leading-7 text-slate-600">Browse available flights, choose a seat, and keep your booking details together. Passenger and booking details entered at checkout are saved with your reservation.</p>
    <p className="mt-4 max-w-2xl leading-7 text-slate-600">This is a student project demonstration. Fares and payment choices are illustrative; no real payment is taken.</p>
  </div>
</section>;
