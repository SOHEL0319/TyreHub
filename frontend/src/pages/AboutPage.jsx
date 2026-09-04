export default function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
        <h1 className="text-3xl font-semibold text-white">About Rasheed Tyres Planet</h1>
        <p className="mt-6 text-white/80">
          TyreHub is built to bring Rasheed Tyres Planet a strong digital presence, transparent product visibility, and fast customer service.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Our Vision</h2>
            <p className="mt-3 text-white/75">To be the most trusted tyre partner across Telangana through quality products and expert service.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Our Mission</h2>
            <p className="mt-3 text-white/75">Provide premium tyres, seamless digital catalog access, and responsive support for every vehicle owner.</p>
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-black/70 p-6">
            <h3 className="text-lg font-semibold text-white">Shop Information</h3>
            <p className="mt-3 text-white/75">Kodad, Telangana</p>
            <p className="mt-2 text-white/75">GST: 37AEAPA8856L1Z7</p>
          </div>
          <div className="rounded-3xl bg-black/70 p-6">
            <h3 className="text-lg font-semibold text-white">Owner Information</h3>
            <p className="mt-3 text-white/75">Rasheed Tyres Planet</p>
            <p className="mt-2 text-white/75">Premium tyre specialists for bikes, cars, autos and lorries.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
