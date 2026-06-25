"use client";

import { useState } from "react";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (code === "sleuthanger@2026") {
      document.cookie = "portfolio_access=true; path=/; max-age=2592000";
      window.location.href = "/portfolio";
    } else {
      setError("Incorrecte code");
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF7EE] flex items-center justify-center px-6 text-[#0E0E12]">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white border border-[#E4D8C2] rounded-2xl p-8"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-[#2B3A33] font-bold">
          Private Access
        </p>

        <h1 className="text-3xl font-bold mt-3">Leovari</h1>

        <p className="text-gray-500 mt-2">
        Enter the access code to view.
        </p>

        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Toegangscode"
          className="w-full mt-6 border border-[#E4D8C2] rounded-xl px-4 py-3 outline-none"
        />

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <button
          type="submit"
          className="w-full mt-6 bg-[#2B3A33] text-white rounded-xl py-3 font-bold"
        >
          Open
        </button>
      </form>
    </main>
  );
}