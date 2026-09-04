const services = [
  {
    name: 'Wheel Alignment',
    description: 'Precision wheel alignment for balanced steering and extended tyre life.',
    benefits: ['Improved handling', 'Reduced tyre wear', 'Better fuel efficiency'],
  },
  {
    name: 'Wheel Balancing',
    description: 'Professional balancing for smoother rides and reduced vibration.',
    benefits: ['Comfortable drive', 'Longer tyre life', 'Reduced noise'],
  },
  {
    name: 'Nitrogen Filling',
    description: 'Stable tyre pressure with nitrogen for consistent performance.',
    benefits: ['Improved pressure retention', 'Cooler tyres', 'Enhanced safety'],
  },
  {
    name: 'Puncture Repair',
    description: 'Fast and reliable puncture repair service for all tyre types.',
    benefits: ['Quick service', 'Safe repair', 'Cost-effective'],
  },
  {
    name: 'Tyre Replacement',
    description: 'Expert tyre replacement with fitment and inspection included.',
    benefits: ['Correct fitment', 'Safety inspection', 'Quality tyres'],
  },
];

export default function ServicesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        {services.map((service) => (
          <div key={service.name} className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
            <h2 className="text-2xl font-semibold text-white">{service.name}</h2>
            <p className="mt-4 text-white/75">{service.description}</p>
            <ul className="mt-6 space-y-2 text-white/70">
              {service.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
