export default function NederlandsePortfolioPage() {
    return (
      <main className="min-h-screen bg-[#f4f3ef] p-12">
        <h1 className="text-4xl font-bold mb-8">
          Nederlandse Portfolio
        </h1>
  
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">
            Current Projects
          </h2>
  
          <p className="text-gray-700 mb-6">
            Deze portfolio toont Nederlandse vastgoedprojecten waarbij de verkoopwaarde
            mede kan worden bepaald op basis van verhuur.
          </p>
  
          <div className="rounded-lg bg-black text-white p-6">
            <p className="text-sm uppercase tracking-wide text-gray-300 mb-2">
              Valuation Logic
            </p>
  
            <p className="text-2xl font-bold">
              Verkoopwaarde = Jaarlijkse huurstroom × Factor
            </p>
  
            <p className="mt-4 text-gray-300">
              Voorbeeld: € 180.000 × 14,5 = € 2.610.000
            </p>
          </div>
        </div>
      </main>
    );
  }