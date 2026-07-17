export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] p-12">
      <h1 className="mb-8 text-4xl font-bold">Leovari</h1>

      <div className="space-y-4">
        <a
          href="/portfolio"
          className="block rounded-lg border bg-black p-4 text-white shadow-sm hover:opacity-90"
        >
          Spanish Portfolio
        </a>

        <a
          href="/nederlandse-portfolio"
          className="block rounded-lg border bg-black p-4 text-white shadow-sm hover:opacity-90"
        >
          Nederlandse Portefeuille
        </a>

        <a
          href="/complete-portfolio"
          className="block rounded-lg border bg-black p-4 text-white shadow-sm hover:opacity-90"
        >
          Complete Portfolio
        </a>

        {/* Bestaande Los Naranjos-pagina */}
        <a
          href="/reports/los-naranjos"
          className="block rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          Los Naranjos Hill Club Project
        </a>

        {/* Nieuwe conceptpagina */}
        <a
          href="/los-naranjos-concept"
          className="flex items-center justify-between rounded-lg border-2 border-dashed border-amber-700 bg-amber-50 p-4 shadow-sm hover:bg-amber-100"
        >
          <span>Los Naranjos – conceptpagina</span>

          <span className="rounded-full bg-amber-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Concept
          </span>
        </a>

        <a
          href="/reports/la-carolina"
          className="block rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          La Carolina Project
        </a>

        <a
          href="/investor-residentieel"
          className="block rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          Investeerder Residentieel Vastgoed
        </a>

        <a
          href="/investor-bedrijfsmatig"
          className="block rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50"
        >
          Investeerder Bedrijfsmatig Vastgoed
        </a>
      </div>
    </main>
  );
}