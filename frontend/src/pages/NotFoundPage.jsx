import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 text-center">
      <div className="rounded-3xl border border-white/10 bg-[#161616] p-12 shadow-2xl">
        <span className="text-6xl font-black text-red-500 block mb-4">404</span>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-white">Page Not Found</h1>
        <p className="mt-3 text-sm text-white/60 max-w-md mx-auto">
          The tyre page or resource you are looking for might have been moved, removed, or is temporarily unavailable.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-500 shadow-lg shadow-red-600/30"
          >
            Back to Home
          </Link>
          <Link
            to="/tyres"
            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
          >
            Browse Tyres
          </Link>
        </div>
      </div>
    </section>
  );
}
