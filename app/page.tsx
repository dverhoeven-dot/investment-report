export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] p-12">
      <h1 className="text-4xl font-bold mb-8">
        Leovari Reports
      </h1>

      <div className="space-y-4">
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
      </div>
    </main>
  );
}