export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] p-12">
      <h1 className="text-4xl font-bold mb-8">
        Leovari
      </h1>

      <div className="space-y-4">

  <a
    href="/portfolio"
    className="block rounded-lg border bg-black text-white p-4 shadow-sm hover:opacity-90"
  >
    Spanish Portfolio
  </a>
  <a
  href="/nederlandse-portfolio"
  className="block rounded-lg border bg-black text-white p-4 shadow-sm hover:opacity-90"
>
  Nederlandse Portfeuille
</a>
<a
  href="/complete-portfolio"
  className="block rounded-lg border bg-black text-white p-4 shadow-sm hover:opacity-90"
>
  Complete Portfolio
</a>
  <a
    href="/reports/los-naranjos"
    className="block rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50"
  >
    Los Naranjos Hill Club Project
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