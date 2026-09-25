"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { FurnitureItem, initialFurnitureItems } from "./furnitureSeed";

const categories = [
  "Alle categorieën",
  "Furniture",
  "Sleeping",
  "Lighting",
  "Accessories",
  "Funrooms",
  "Outdoor",
];

const statuses = [
  "Geselecteerd",
  "Offerte aangevraagd",
  "Besteld",
  "Aanbetaling",
  "Onderweg",
  "Geleverd",
  "Geplaatst",
];

const paymentStatuses = ["Niet betaald", "Aanbetaling", "Volledig betaald"];

const standardLocations = [
  "Calderon de la Barca",
  "Meuleveldlaan 30",
  "Calle Margarita 7",
];

const normalizeLocation = (value: string) => {
  const location = value.trim().toLowerCase();

  if (!location) return "";

  if (location.includes("calderon")) {
    return "Calderon de la Barca";
  }

  if (location.includes("meuleveldlaan")) {
    return "Meuleveldlaan 30";
  }

  if (location.includes("calle margarita")) {
    return "Calle Margarita 7";
  }

  return value.trim();
};

const euro = (value: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const cleanNumber = (value: string) => {
  const normalized = value
    .replace(/[€\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: string) => {
  if (!value) return "Nog niet ingevuld";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

type DraftItem = {
  name: string;
  category: string;
  location: string;
  purchasePrice: string;
  normalPrice: string;
  quantity: string;
  supplier: string;
  status: string;
  paymentStatus: string;
  expectedDelivery: string;
  productUrl: string;
  notes: string;
  imagePreview: string;
};

const emptyDraft = (): DraftItem => ({
  name: "",
  category: "Furniture",
  location: "",
  purchasePrice: "",
  normalPrice: "",
  quantity: "1",
  supplier: "",
  status: "Geselecteerd",
  paymentStatus: "Niet betaald",
  expectedDelivery: "",
  productUrl: "",
  notes: "",
  imagePreview: "",
});

export default function FurnitureProcurementClient() {
  const [items, setItems] = useState<FurnitureItem[]>(() =>
    initialFurnitureItems.map((item) => ({
      ...item,
      location: normalizeLocation(item.location),
    }))
  );
  const [view, setView] = useState<"gallery" | "table">("gallery");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Alle categorieën");
  const [status, setStatus] = useState("Alle statussen");
  const [location, setLocation] = useState("Alle locaties");
  const [lightbox, setLightbox] = useState<{ itemId: string; imageIndex: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftItem>(emptyDraft());
  const [notice, setNotice] = useState("");

  const locations = useMemo(() => {
    const values = Array.from(
      new Set(items.map((item) => item.location.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ["Alle locaties", ...values];
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !query ||
        [item.name, item.itemNo, item.location, item.supplier, item.category]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchCategory =
        category === "Alle categorieën" || item.category === category;
      const matchStatus = status === "Alle statussen" || item.status === status;
      const matchLocation =
        location === "Alle locaties" || item.location === location;
      return matchSearch && matchCategory && matchStatus && matchLocation;
    });
  }, [items, search, category, status, location]);

  const totals = useMemo(() => {
    const purchase = items.reduce(
      (sum, item) => sum + item.purchasePrice * item.quantity,
      0
    );
    const normal = items.reduce(
      (sum, item) => sum + item.normalPrice * item.quantity,
      0
    );
    const savings = Math.max(0, normal - purchase);
    const delivered = items.filter((item) =>
      ["Geleverd", "Geplaatst"].includes(item.status)
    ).length;
    return { purchase, normal, savings, delivered };
  }, [items]);

  const activeLightboxItem = lightbox
    ? items.find((item) => item.id === lightbox.itemId) || null
    : null;
  const activeLightboxImage =
    activeLightboxItem && lightbox
      ? activeLightboxItem.images[lightbox.imageIndex]
      : null;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function openNewItem() {
    setEditingId(null);
    setDraft(emptyDraft());
    setShowForm(true);
  }

  function openEdit(item: FurnitureItem) {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      category: item.category,
      location: item.location,
      purchasePrice: item.purchasePrice ? String(item.purchasePrice) : "",
      normalPrice: item.normalPrice ? String(item.normalPrice) : "",
      quantity: String(item.quantity || 1),
      supplier: item.supplier,
      status: item.status,
      paymentStatus: item.paymentStatus,
      expectedDelivery: item.expectedDelivery,
      productUrl: item.productUrl,
      notes: item.notes,
      imagePreview: item.images[0] || "",
    });
    setShowForm(true);
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraft((current) => ({ ...current, imagePreview: url }));
  }

  function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: draft.name.trim(),
                category: draft.category,
                location: normalizeLocation(draft.location),
                purchasePrice: cleanNumber(draft.purchasePrice),
                normalPrice: cleanNumber(draft.normalPrice),
                quantity: Math.max(1, Math.round(cleanNumber(draft.quantity) || 1)),
                supplier: draft.supplier.trim(),
                status: draft.status,
                paymentStatus: draft.paymentStatus,
                expectedDelivery: draft.expectedDelivery,
                productUrl: draft.productUrl.trim(),
                notes: draft.notes.trim(),
                images: draft.imagePreview
                  ? [draft.imagePreview, ...item.images.filter((x) => x !== draft.imagePreview)]
                  : item.images,
              }
            : item
        )
      );
      flash("Item bijgewerkt");
    } else {
      const nextNumber = items.length + 1;
      setItems((current) => [
        {
          id: `local-${Date.now()}`,
          itemNo: `ART.${String(nextNumber).padStart(2, "0")}`,
          name: draft.name.trim(),
          category: draft.category,
          location: normalizeLocation(draft.location),
          purchasePrice: cleanNumber(draft.purchasePrice),
          normalPrice: cleanNumber(draft.normalPrice),
          quantity: Math.max(1, Math.round(cleanNumber(draft.quantity) || 1)),
          supplier: draft.supplier.trim(),
          status: draft.status,
          paymentStatus: draft.paymentStatus,
          expectedDelivery: draft.expectedDelivery,
          productUrl: draft.productUrl.trim(),
          notes: draft.notes.trim(),
          images: draft.imagePreview ? [draft.imagePreview] : [],
        },
        ...current,
      ]);
      flash("Nieuw item toegevoegd");
    }

    setShowForm(false);
    setEditingId(null);
    setDraft(emptyDraft());
  }

  function removeItem(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    if (!window.confirm(`"${item.name}" verwijderen?`)) return;
    setItems((current) => current.filter((entry) => entry.id !== id));
    flash("Item verwijderd");
  }

  function updateQuickStatus(id: string, nextStatus: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item
      )
    );
  }

  function stepLightbox(direction: 1 | -1) {
    if (!activeLightboxItem || !lightbox || activeLightboxItem.images.length <= 1)
      return;
    const count = activeLightboxItem.images.length;
    const next = (lightbox.imageIndex + direction + count) % count;
    setLightbox({ ...lightbox, imageIndex: next });
    setZoom(1);
  }

  return (
    <main className="furniture-shell">
      <div className="page-wrap">
        <header className="hero">
          <div>
            <p className="eyebrow">L3 CAPITAL · INTERNE TOOL</p>
            <h1>Furniture Procurement</h1>
            <p className="hero-copy">
              Visueel meubeloverzicht voor selectie, aankoop, levering en plaatsing.
            </p>
          </div>
          <div className="project-chip">
            <span>PROJECT</span>
            <strong>Demo / nog niet gekoppeld</strong>
            <small>Koppeling met actuele projecten volgt later</small>
          </div>
        </header>

        <section className="metric-grid">
          <Metric label="Aankoopwaarde" value={euro(totals.purchase)} />
          <Metric label="Normale waarde" value={euro(totals.normal)} />
          <Metric
            label="Besparing t.o.v. normaal"
            value={euro(totals.savings)}
            accent
          />
          <Metric
            label="Geleverd / geplaatst"
            value={`${totals.delivered} / ${items.length}`}
          />
        </section>

        <section className="toolbar">
          <div className="filters">
            <label className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Zoek meubel, locatie, leverancier..."
              />
            </label>

            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>

            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Alle statussen</option>
              {statuses.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>

            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              {locations.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </div>

          <div className="actions">
            <div className="view-switch">
              <button
                className={view === "gallery" ? "active" : ""}
                onClick={() => setView("gallery")}
              >
                ▦ Galerij
              </button>
              <button
                className={view === "table" ? "active" : ""}
                onClick={() => setView("table")}
              >
                ☰ Tabel
              </button>
            </div>
            <button className="primary-button" onClick={openNewItem}>
              + Nieuw meubel
            </button>
          </div>
        </section>

        <div className="result-line">
          <strong>{filtered.length}</strong> items zichtbaar
          {(search ||
            category !== "Alle categorieën" ||
            status !== "Alle statussen" ||
            location !== "Alle locaties") && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("Alle categorieën");
                setStatus("Alle statussen");
                setLocation("Alle locaties");
              }}
            >
              Filters wissen
            </button>
          )}
        </div>

        {view === "gallery" ? (
          <section className="gallery">
            {filtered.map((item) => (
              <article className="item-card" key={item.id}>
                <button
                  className="image-button"
                  disabled={!item.images[0]}
                  onClick={() => {
                    if (!item.images[0]) return;
                    setLightbox({ itemId: item.id, imageIndex: 0 });
                    setZoom(1);
                  }}
                  title={item.images[0] ? "Klik om te vergroten" : "Geen foto"}
                >
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="image-placeholder">
                      <span>Geen foto</span>
                      <small>Voeg een productfoto toe</small>
                    </div>
                  )}
                  {item.images.length > 0 && (
                    <div className="zoom-hint">⌕ Vergroten</div>
                  )}
                  {item.images.length > 1 && (
                    <div className="photo-count">{item.images.length} foto&apos;s</div>
                  )}
                </button>

                <div className="card-body">
                  <div className="card-meta">
                    <span className="category-pill">{item.category}</span>
                    <span>{item.itemNo}</span>
                  </div>
                  <h2>{item.name}</h2>
                  <p className="location">
                    {item.location ? `⌖ ${item.location}` : "Locatie nog niet ingevuld"}
                  </p>
                  <p className="delivery-date">
                    <span>Datum</span>
                    <strong>{formatDate(item.expectedDelivery)}</strong>
                  </p>

                  <div className="price-grid">
                    <div>
                      <span>Aankoop</span>
                      <strong>{euro(item.purchasePrice * item.quantity)}</strong>
                    </div>
                    <div>
                      <span>Normale waarde</span>
                      <strong>{euro(item.normalPrice * item.quantity)}</strong>
                    </div>
                  </div>

                  <div className="card-status">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        updateQuickStatus(item.id, event.target.value)
                      }
                    >
                      {statuses.map((entry) => (
                        <option key={entry}>{entry}</option>
                      ))}
                    </select>
                    <span className={`payment payment-${item.paymentStatus.replace(/\s/g, "-").toLowerCase()}`}>
                      {item.paymentStatus}
                    </span>
                  </div>

                  <div className="card-footer">
                    <button onClick={() => openEdit(item)}>Bewerken</button>
                    <button className="danger-link" onClick={() => removeItem(item.id)}>
                      Verwijderen
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Item</th>
                    <th>Categorie</th>
                    <th>Locatie</th>
                    <th>Aantal</th>
                    <th>Aankoop</th>
                    <th>Normale waarde</th>
                    <th>Status</th>
                    <th>Betaling</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          className="thumb-button"
                          disabled={!item.images[0]}
                          onClick={() => {
                            if (!item.images[0]) return;
                            setLightbox({ itemId: item.id, imageIndex: 0 });
                            setZoom(1);
                          }}
                        >
                          {item.images[0] ? (
                            <img src={item.images[0]} alt="" />
                          ) : (
                            <span>—</span>
                          )}
                        </button>
                      </td>
                      <td className="table-name">
                        <strong>{item.name}</strong>
                        <small>{item.itemNo}</small>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.location || "—"}</td>
                      <td>{item.quantity}</td>
                      <td>{euro(item.purchasePrice * item.quantity)}</td>
                      <td>{euro(item.normalPrice * item.quantity)}</td>
                      <td>
                        <select
                          className="table-select"
                          value={item.status}
                          onChange={(event) =>
                            updateQuickStatus(item.id, event.target.value)
                          }
                        >
                          {statuses.map((entry) => (
                            <option key={entry}>{entry}</option>
                          ))}
                        </select>
                      </td>
                      <td>{item.paymentStatus}</td>
                      <td>
                        <button className="text-button" onClick={() => openEdit(item)}>
                          Bewerk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="prototype-note">
          <strong>Prototype-modus</strong>
          <p>
            De pagina werkt nu volledig lokaal in de browser. Nieuwe items en wijzigingen
            verdwijnen bij een refresh. In de volgende stap koppelen we dit aan Supabase en
            daarna aan jullie actuele projecten.
          </p>
        </section>
      </div>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowForm(false)}>
          <form
            className="edit-modal"
            onSubmit={saveDraft}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">{editingId ? "ITEM BEWERKEN" : "NIEUW ITEM"}</p>
                <h2>{editingId ? "Meubel aanpassen" : "Meubel toevoegen"}</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <div className="form-grid">
              <label className="wide">
                <span>Product / omschrijving</span>
                <input
                  required
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="Bijv. Minotti sofa"
                />
              </label>

              <label>
                <span>Categorie</span>
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                >
                  {categories.filter((entry) => entry !== "Alle categorieën").map((entry) => (
                    <option key={entry}>{entry}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Huidige locatie</span>
                <select
                  value={draft.location}
                  onChange={(event) =>
                    setDraft({ ...draft, location: event.target.value })
                  }
                >
                  <option value="">Kies locatie</option>
                  {standardLocations.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Aankoopprijs</span>
                <input
                  value={draft.purchasePrice}
                  onChange={(event) => setDraft({ ...draft, purchasePrice: event.target.value })}
                  placeholder="€ 0"
                  inputMode="decimal"
                />
              </label>

              <label>
                <span>Normale prijs</span>
                <input
                  value={draft.normalPrice}
                  onChange={(event) => setDraft({ ...draft, normalPrice: event.target.value })}
                  placeholder="€ 0"
                  inputMode="decimal"
                />
              </label>

              <label>
                <span>Aantal</span>
                <input
                  value={draft.quantity}
                  onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                  inputMode="numeric"
                />
              </label>

              <label>
                <span>Leverancier</span>
                <input
                  value={draft.supplier}
                  onChange={(event) => setDraft({ ...draft, supplier: event.target.value })}
                  placeholder="Leverancier"
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                >
                  {statuses.map((entry) => (
                    <option key={entry}>{entry}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Betaalstatus</span>
                <select
                  value={draft.paymentStatus}
                  onChange={(event) =>
                    setDraft({ ...draft, paymentStatus: event.target.value })
                  }
                >
                  {paymentStatuses.map((entry) => (
                    <option key={entry}>{entry}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Verwachte levering</span>
                <input
                  type="date"
                  value={draft.expectedDelivery}
                  onChange={(event) =>
                    setDraft({ ...draft, expectedDelivery: event.target.value })
                  }
                />
              </label>

              <label>
                <span>Productlink</span>
                <input
                  value={draft.productUrl}
                  onChange={(event) => setDraft({ ...draft, productUrl: event.target.value })}
                  placeholder="https://..."
                />
              </label>

              <label className="wide">
                <span>Productfoto</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {draft.imagePreview && (
                  <img className="form-preview" src={draft.imagePreview} alt="Voorbeeld" />
                )}
              </label>

              <label className="wide">
                <span>Opmerkingen</span>
                <textarea
                  rows={3}
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  placeholder="Afmetingen, kleur, afspraken, bijzonderheden..."
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
                Annuleren
              </button>
              <button className="primary-button" type="submit">
                {editingId ? "Wijzigingen opslaan" : "Item toevoegen"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeLightboxItem && activeLightboxImage && lightbox && (
        <div
          className="lightbox"
          onMouseDown={() => {
            setLightbox(null);
            setZoom(1);
          }}
        >
          <div className="lightbox-top">
            <div>
              <small>{activeLightboxItem.itemNo} · {activeLightboxItem.category}</small>
              <strong>{activeLightboxItem.name}</strong>
            </div>
            <button
              onClick={() => {
                setLightbox(null);
                setZoom(1);
              }}
            >
              ×
            </button>
          </div>

          <div
            className="lightbox-stage"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {activeLightboxItem.images.length > 1 && (
              <button className="nav-arrow left" onClick={() => stepLightbox(-1)}>
                ‹
              </button>
            )}
            <div className="zoom-viewport">
              <img
                src={activeLightboxImage}
                alt={activeLightboxItem.name}
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
            {activeLightboxItem.images.length > 1 && (
              <button className="nav-arrow right" onClick={() => stepLightbox(1)}>
                ›
              </button>
            )}
          </div>

          <div className="zoom-controls" onMouseDown={(event) => event.stopPropagation()}>
            <button onClick={() => setZoom((current) => Math.max(1, current - 0.25))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((current) => Math.min(3, current + 0.25))}>+</button>
            <button onClick={() => setZoom(1)}>Reset</button>
            {activeLightboxItem.images.length > 1 && (
              <span>
                Foto {lightbox.imageIndex + 1} / {activeLightboxItem.images.length}
              </span>
            )}
          </div>
        </div>
      )}

      {notice && <div className="toast">{notice}</div>}

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #eeeae1; color: #27231d; }
        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }

        .furniture-shell {
          min-height: 100vh;
          padding: 28px 18px 70px;
          background:
            radial-gradient(circle at 10% 0%, rgba(194,154,84,.12), transparent 28%),
            #eeeae1;
          font-family: Arial, Helvetica, sans-serif;
        }
        .page-wrap { max-width: 1420px; margin: 0 auto; }

        .hero {
          background: #2a241d;
          color: white;
          border-radius: 22px;
          padding: 28px 30px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          box-shadow: 0 18px 55px rgba(34,27,20,.12);
        }
        .eyebrow {
          margin: 0 0 8px;
          font-size: 11px;
          letter-spacing: .18em;
          font-weight: 800;
          color: #c7a56a;
        }
        .hero h1 { font-size: clamp(30px, 4vw, 48px); margin: 0; letter-spacing: -.035em; }
        .hero-copy { color: #d9d2c6; margin: 9px 0 0; font-size: 15px; }
        .project-chip {
          min-width: 280px;
          padding: 14px 16px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 14px;
          display: grid;
          gap: 4px;
        }
        .project-chip span { font-size: 9px; letter-spacing: .17em; color: #c7a56a; font-weight: 800; }
        .project-chip strong { font-size: 14px; }
        .project-chip small { color: #bbb3a7; font-size: 11px; }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 12px;
          margin: 14px 0;
        }
        .metric {
          background: rgba(255,255,255,.82);
          border: 1px solid #ddd3c4;
          border-radius: 16px;
          padding: 18px 19px;
        }
        .metric span { display: block; font-size: 11px; font-weight: 800; color: #7f7568; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .09em; }
        .metric strong { font-size: 25px; letter-spacing: -.03em; }
        .metric.accent { background: #efe3c9; border-color: #d8bf91; }

        .toolbar {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,.86);
          border: 1px solid #ddd3c4;
          border-radius: 16px;
          padding: 11px;
          position: sticky;
          top: 10px;
          z-index: 20;
          box-shadow: 0 10px 30px rgba(55,44,31,.06);
        }
        .filters { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; }
        .search-box {
          height: 42px;
          min-width: 290px;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          background: #f8f5ef;
          border: 1px solid #ded6ca;
          border-radius: 11px;
        }
        .search-box span { font-size: 19px; color: #807463; }
        .search-box input { width: 100%; border: 0; outline: 0; background: transparent; }
        .toolbar select, .card-status select, .table-select {
          min-height: 42px;
          border: 1px solid #ded6ca;
          border-radius: 11px;
          padding: 0 34px 0 11px;
          background: #fff;
          color: #332d25;
        }
        .actions { display: flex; align-items: center; gap: 8px; }
        .view-switch {
          display: flex;
          padding: 3px;
          background: #eee9df;
          border-radius: 11px;
        }
        .view-switch button {
          border: 0;
          background: transparent;
          padding: 9px 11px;
          border-radius: 8px;
          color: #74695b;
          font-size: 12px;
          font-weight: 700;
        }
        .view-switch button.active { background: white; color: #2a241d; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
        .primary-button, .secondary-button {
          border: 1px solid #2a241d;
          border-radius: 11px;
          min-height: 42px;
          padding: 0 15px;
          font-weight: 800;
          font-size: 12px;
        }
        .primary-button { background: #2a241d; color: white; }
        .secondary-button { background: white; color: #2a241d; }

        .result-line {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 13px 4px 11px;
          font-size: 12px;
          color: #756c60;
        }
        .result-line button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: #866335;
          text-decoration: underline;
          font-size: 11px;
        }

        .gallery {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .item-card {
          background: #fff;
          border: 1px solid #ddd3c4;
          border-radius: 17px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(48,37,24,.045);
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .image-button {
          width: 100%;
          aspect-ratio: 4/3;
          border: 0;
          padding: 0;
          background: #e9e4da;
          position: relative;
          overflow: hidden;
          cursor: zoom-in;
        }
        .image-button:disabled { cursor: default; }
        .image-button img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #f3f0e9;
          transition: transform .25s ease;
        }
        .image-button:not(:disabled):hover img { transform: scale(1.025); }
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-content: center;
          gap: 5px;
          color: #8c8377;
        }
        .image-placeholder span { font-weight: 800; }
        .image-placeholder small { font-size: 11px; }
        .zoom-hint, .photo-count {
          position: absolute;
          bottom: 10px;
          background: rgba(31,27,22,.80);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 7px 9px;
          border-radius: 999px;
          backdrop-filter: blur(4px);
        }
        .zoom-hint { left: 10px; }
        .photo-count { right: 10px; }

        .card-body { padding: 15px; display: flex; flex-direction: column; flex: 1; }
        .card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 10px; color: #8a8176; }
        .category-pill {
          background: #f0e7d6;
          color: #6e5330;
          padding: 5px 7px;
          border-radius: 999px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .card-body h2 {
          font-size: 16px;
          line-height: 1.28;
          margin: 11px 0 7px;
          min-height: 41px;
        }
        .location { margin: 0; color: #82786c; font-size: 11px; min-height: 28px; }
        .price-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin-top: 12px;
        }
        .delivery-date {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 8px 0 2px;
          padding: 8px 10px;
          border-radius: 10px;
          background: #f7f3eb;
          font-size: 12px;
          color: #706456;
        }
        .delivery-date span {
          font-weight: 700;
        }
        .delivery-date strong {
          color: #2d241b;
          font-size: 12px;
        }

        .price-grid > div {
          padding: 9px;
          background: #f8f5ef;
          border-radius: 10px;
        }
        .price-grid span { display: block; font-size: 9px; color: #8c8174; margin-bottom: 3px; }
        .price-grid strong { font-size: 13px; }
        .card-status {
          display: flex;
          gap: 7px;
          align-items: center;
          margin-top: 10px;
        }
        .card-status select { flex: 1; min-width: 0; min-height: 36px; font-size: 10px; padding-left: 9px; }
        .payment {
          white-space: nowrap;
          font-size: 9px;
          font-weight: 800;
          border-radius: 999px;
          padding: 7px 8px;
          background: #f1eee8;
          color: #776d61;
        }
        .payment-volledig-betaald { background: #e3efe5; color: #47704c; }
        .payment-aanbetaling { background: #f3e8cd; color: #856729; }
        .card-footer {
          border-top: 1px solid #eee8df;
          margin-top: 12px;
          padding-top: 11px;
          display: flex;
          gap: 12px;
        }
        .card-footer button, .text-button {
          border: 0;
          background: transparent;
          padding: 0;
          font-size: 10px;
          font-weight: 800;
          color: #6b5232;
        }
        .card-footer .danger-link { color: #9a554e; margin-left: auto; }

        .table-card {
          background: white;
          border: 1px solid #ddd3c4;
          border-radius: 17px;
          overflow: hidden;
        }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 1150px; }
        th {
          text-align: left;
          font-size: 9px;
          color: #7c7266;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 12px;
          background: #f7f3ec;
          border-bottom: 1px solid #ded6ca;
        }
        td { padding: 10px 12px; border-bottom: 1px solid #eee8df; font-size: 11px; vertical-align: middle; }
        tbody tr:hover { background: #fbf9f5; }
        .thumb-button { width: 52px; height: 42px; border: 0; border-radius: 7px; overflow: hidden; padding: 0; background: #eee9df; }
        .thumb-button img { width: 100%; height: 100%; object-fit: cover; }
        .table-name { max-width: 280px; }
        .table-name strong { display: block; }
        .table-name small { color: #958b7e; display: block; margin-top: 3px; }
        .table-select { min-height: 34px; font-size: 10px; }

        .prototype-note {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 13px;
          border: 1px dashed #c8b99f;
          color: #6e6253;
          background: rgba(247,241,231,.7);
          font-size: 11px;
          display: flex;
          gap: 12px;
          align-items: baseline;
        }
        .prototype-note p { margin: 0; }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(30,25,20,.58);
          padding: 24px;
          display: grid;
          place-items: center;
          overflow-y: auto;
        }
        .edit-modal {
          width: min(820px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: #f8f5ef;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 25px 90px rgba(0,0,0,.25);
        }
        .modal-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
        .modal-head h2 { margin: 0; font-size: 25px; }
        .close-button { border: 0; background: transparent; font-size: 27px; line-height: 1; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-grid label { display: grid; gap: 6px; font-size: 10px; color: #766b5d; font-weight: 800; }
        .form-grid .wide { grid-column: 1 / -1; }
        .form-grid input, .form-grid select, .form-grid textarea {
          border: 1px solid #d9cfbf;
          border-radius: 10px;
          background: white;
          padding: 11px 12px;
          min-height: 42px;
          outline: 0;
          color: #2a241d;
        }
        .form-preview {
          max-height: 210px;
          max-width: 100%;
          object-fit: contain;
          border-radius: 10px;
          background: white;
          border: 1px solid #ded6ca;
        }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }

        .lightbox {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(16,14,12,.94);
          color: white;
          display: grid;
          grid-template-rows: auto 1fr auto;
        }
        .lightbox-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,.12);
        }
        .lightbox-top div { display: grid; gap: 3px; min-width: 0; }
        .lightbox-top small { color: #c7a56a; font-size: 9px; }
        .lightbox-top strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
        .lightbox-top button { border: 0; background: transparent; color: white; font-size: 28px; }
        .lightbox-stage { min-height: 0; position: relative; display: grid; place-items: center; padding: 18px 60px; }
        .zoom-viewport {
          width: 100%;
          height: 100%;
          overflow: auto;
          display: grid;
          place-items: center;
        }
        .zoom-viewport img {
          max-width: 92%;
          max-height: 78vh;
          object-fit: contain;
          transform-origin: center center;
          transition: transform .15s ease;
        }
        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 58px;
          border: 0;
          border-radius: 10px;
          background: rgba(255,255,255,.1);
          color: white;
          font-size: 35px;
          z-index: 2;
        }
        .nav-arrow.left { left: 12px; }
        .nav-arrow.right { right: 12px; }
        .zoom-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px;
          border-top: 1px solid rgba(255,255,255,.12);
        }
        .zoom-controls button {
          border: 1px solid rgba(255,255,255,.16);
          background: rgba(255,255,255,.08);
          color: white;
          border-radius: 8px;
          padding: 7px 11px;
        }
        .zoom-controls span { font-size: 11px; color: #d6d0c8; }

        .toast {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 150;
          background: #2a241d;
          color: white;
          border-radius: 10px;
          padding: 11px 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,.2);
          font-size: 12px;
          font-weight: 800;
        }

        @media (max-width: 1180px) {
          .gallery { grid-template-columns: repeat(3, minmax(0,1fr)); }
          .metric-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .toolbar { align-items: stretch; flex-direction: column; }
          .actions { justify-content: space-between; }
        }
        @media (max-width: 820px) {
          .hero { flex-direction: column; align-items: stretch; }
          .project-chip { min-width: 0; }
          .gallery { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .search-box { min-width: 100%; }
          .filters select { flex: 1; }
        }
        @media (max-width: 560px) {
          .furniture-shell { padding: 10px 8px 45px; }
          .hero { border-radius: 15px; padding: 20px; }
          .metric-grid { grid-template-columns: 1fr 1fr; }
          .metric { padding: 14px; }
          .metric strong { font-size: 18px; }
          .gallery { grid-template-columns: 1fr; }
          .actions { align-items: stretch; flex-direction: column; }
          .primary-button { width: 100%; }
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .wide { grid-column: auto; }
          .prototype-note { flex-direction: column; gap: 4px; }
          .lightbox-stage { padding: 10px 44px; }
        }
      `}</style>
    </main>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric${accent ? " accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
