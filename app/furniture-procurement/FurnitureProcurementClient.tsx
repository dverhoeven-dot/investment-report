"use client";

import {usePortalAccess} from "@/components/portal/ReadOnlyBoundary";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
type FurnitureItem = {
  id: string;
  itemNo: string;
  name: string;
  category: string;
  location: string;
  placementLocation: string;
  dimensions: string;
  purchasePrice: number;
  normalPrice: number;
  quantity: number;
  status: string;
  paymentStatus: string;
  supplier: string;
  productUrl: string;
  notes: string;
  images: string[];
  sourceRow?: number;
};

const categories = [
  "All categories",
  "Furniture",
  "Sleeping",
  "Lighting",
  "Accessories",
  "Funrooms",
  "Outdoor",
];

// Keep the stored values unchanged so existing Supabase records remain compatible.
const statusOptions = [
  { value: "Geselecteerd", label: "Selected" },
  { value: "Offerte aangevraagd", label: "Quote requested" },
  { value: "Besteld", label: "Ordered" },
  { value: "Aanbetaling", label: "Deposit paid" },
  { value: "Onderweg", label: "In transit" },
  { value: "Geleverd", label: "Delivered" },
  { value: "Geplaatst", label: "Installed" },
];

const paymentStatusOptions = [
  { value: "Niet betaald", label: "Unpaid" },
  { value: "Aanbetaling", label: "Deposit paid" },
  { value: "Volledig betaald", label: "Paid in full" },
];

const paymentStatusLabel = (value: string) =>
  paymentStatusOptions.find((option) => option.value === value)?.label ?? value;

const standardLocations = [
  "Calderon de la Barca",
  "Meuleveldlaan 30",
  "Calle Margarita 7",
];

const normalizeLocation = (value: string) => {
  const location = value.trim().toLowerCase();

  if (!location) return "";

  if (/^(calderon(?: de la barca)?)$/.test(location)) {
    return "Calderon de la Barca";
  }

  if (/^(meuleveldlaan(?: 30)?)$/.test(location)) {
    return "Meuleveldlaan 30";
  }

  if (/^(calle margarita(?: 7)?)$/.test(location)) {
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

const formatMoneyInput = (value: string) => {
  const cleaned = value
    .replace(/[€\s]/g, "")
    .replace(/\./g, "")
    .replace(/[^\d,]/g, "");

  if (!cleaned) return "";

  const hasDecimalComma = cleaned.includes(",");
  const [integerPart = "", decimalPart = ""] = cleaned.split(",", 2);
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const formattedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (!hasDecimalComma) return formattedInteger;

  const decimals = decimalPart.replace(/\D/g, "").slice(0, 2);
  return `${formattedInteger},${decimals}`;
};

const discountPercentage = (purchasePrice: number, normalPrice: number) => {
  if (!Number.isFinite(purchasePrice) || !Number.isFinite(normalPrice)) return null;
  if (purchasePrice <= 0 || normalPrice <= 0) return null;

  const percentage = ((normalPrice - purchasePrice) / normalPrice) * 100;
  return Math.max(0, percentage);
};

const formatPercentage = (value: number | null) =>
  value === null
    ? "—"
    : `${new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 }).format(value)}%`;

type ProductImportResult = {
  url?: string;
  name?: string;
  supplier?: string;
  description?: string;
  price?: number | null;
  currency?: string;
  imageUrl?: string;
  sku?: string;
};

type DraftItem = {
  name: string;
  category: string;
  location: string;
  placementLocation: string;
  dimensions: string;
  purchasePrice: string;
  normalPrice: string;
  quantity: string;
  supplier: string;
  status: string;
  paymentStatus: string;
  productUrl: string;
  notes: string;
  imagePreview: string;
};

const emptyDraft = (): DraftItem => ({
  name: "",
  category: "Furniture",
  location: "",
  placementLocation: "",
  dimensions: "",
  purchasePrice: "",
  normalPrice: "",
  quantity: "1",
  supplier: "",
  status: "Geselecteerd",
  paymentStatus: "Niet betaald",
  productUrl: "",
  notes: "",
  imagePreview: "",
});

export default function FurnitureProcurementClient() {
 const {readOnly}=usePortalAccess();
  const [properties,setProperties]=useState<string[]>([]);
  const [propertyName,setPropertyName]=useState("");
  const [showPropertyForm,setShowPropertyForm]=useState(false);
  const [propertyBusy,setPropertyBusy]=useState(false);
  const [assigning,setAssigning]=useState<string[]>([]);
  const [propertyError,setPropertyError]=useState("");
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [storageError, setStorageError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [view, setView] = useState<"gallery" | "table">("gallery");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [location, setLocation] = useState("All locations");
  const [lightbox, setLightbox] = useState<{ itemId: string; imageIndex: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftItem>(emptyDraft());
  const [notice, setNotice] = useState("");
  const [importingProduct, setImportingProduct] = useState(false);
  const [productImportError, setProductImportError] = useState("");
  const [productImportInfo, setProductImportInfo] = useState("");

  useEffect(() => {
    void loadItems();
    void fetch("/api/furniture-properties",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setProperties(data.properties??[]);}).catch(()=>setPropertyError("Properties could not be loaded. Please refresh the page."));
  }, []);

  async function loadItems() {
    setLoadingItems(true);
    setStorageError("");

    try {
      const response = await fetch("/api/furniture-items", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { items?: FurnitureItem[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Furniture items could not be loaded.");
      }

      // Supabase is the only source of truth for the furniture list.
      // No seed/import is synchronized when the page loads.
      // Deleted or manually edited items therefore remain deleted/edited after refresh.
      const loadedItems = payload?.items ?? [];

      setItems(
        loadedItems.map((item) => ({
          ...item,
          location: normalizeLocation(item.location || ""),
        }))
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Online storage could not be loaded.";
      setStorageError(message);

      // On a storage error we do not show stale sample data; the page intentionally stays empty.
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }

  const locations = useMemo(() => {
    const values = Array.from(
      new Set([...standardLocations,...properties,...items.map((item) => item.location.trim())].filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ["All locations", ...values];
  }, [items,properties]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !query ||
        [item.name, item.itemNo, item.location, item.placementLocation, item.dimensions, item.supplier, item.category]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchCategory =
        category === "All categories" || item.category === category;
      const matchStatus = status === "All statuses" || item.status === status;
      const matchLocation =
        location === "All locations" || item.location === location;
      return matchSearch && matchCategory && matchStatus && matchLocation;
    });
  }, [items, search, category, status, location]);

  const totals = useMemo(() => {
    const purchase = items.reduce(
      (sum, item) => sum + item.purchasePrice,
      0
    );
    const normal = items.reduce(
      (sum, item) => sum + item.normalPrice,
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

  async function saveProperty(event:FormEvent){
    event.preventDefault();if(readOnly||propertyBusy)return;setPropertyBusy(true);setPropertyError("");
    try{const response=await fetch("/api/furniture-properties",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:propertyName.trim()})});const data=await response.json();if(!response.ok)throw new Error(data.error||"The property could not be saved.");setProperties(data.properties);setLocation(data.properties.find((name:string)=>name.toLowerCase()===propertyName.trim().toLowerCase())??propertyName.trim());setShowPropertyForm(false);setPropertyName("");flash("Property added. You can now link furniture to this property.");}catch(error){setPropertyError(error instanceof Error?error.message:"The property could not be saved.");}finally{setPropertyBusy(false);}
  }

  function openNewItem() {
    if(readOnly) return;
    setEditingId(null);
    setPendingImageFile(null);
    setDraft({...emptyDraft(),location:location!=="All locations"?location:""});
    setProductImportError("");
    setProductImportInfo("");
    setShowForm(true);
  }

  function openEdit(item: FurnitureItem) {
    if(readOnly) return;
    setEditingId(item.id);
    setPendingImageFile(null);
    setProductImportError("");
    setProductImportInfo("");
    setDraft({
      name: item.name,
      category: item.category,
      location: item.location,
      placementLocation: item.placementLocation || "",
      dimensions: item.dimensions || "",
      purchasePrice: item.purchasePrice ? formatMoneyInput(String(item.purchasePrice)) : "",
      normalPrice: item.normalPrice ? formatMoneyInput(String(item.normalPrice)) : "",
      quantity: String(item.quantity || 1),
      supplier: item.supplier,
      status: item.status,
      paymentStatus: item.paymentStatus,
      productUrl: item.productUrl,
      notes: item.notes,
      imagePreview: item.images[0] || "",
    });
    setShowForm(true);
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    if(readOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      flash("The image is too large. Maximum size is 15 MB.");
      event.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setPendingImageFile(file);
    setDraft((current) => ({ ...current, imagePreview: url }));
  }

  async function uploadPendingImage() {
    if(readOnly) return;
    if (!pendingImageFile) return null;

    const formData = new FormData();
    formData.append("file", pendingImageFile);

    const response = await fetch("/api/furniture-images", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;

    if (!response.ok || !payload?.url) {
      throw new Error(payload?.error || "The image could not be saved online.");
    }

    return payload.url;
  }

  async function importProductFromUrl() {
    if(readOnly) return;
    const productUrl = draft.productUrl.trim();

    setProductImportError("");
    setProductImportInfo("");

    if (!productUrl) {
      setProductImportError("Paste a product link first.");
      return;
    }

    try {
      new URL(productUrl);
    } catch {
      setProductImportError("This does not appear to be a valid product link.");
      return;
    }

    setImportingProduct(true);

    try {
      const response = await fetch("/api/product-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (ProductImportResult & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Product information could not be retrieved.");
      }

      if (!payload) {
        throw new Error("The product page did not return usable information.");
      }

      const foundFields = [
        payload.name,
        payload.supplier,
        typeof payload.price === "number" ? payload.price : null,
        payload.imageUrl,
      ].filter(Boolean).length;

      setDraft((current) => ({
        ...current,
        productUrl: payload.url || current.productUrl,
        name: payload.name || current.name,
        supplier: payload.supplier || current.supplier,
        normalPrice:
          typeof payload.price === "number" && Number.isFinite(payload.price)
            ? formatMoneyInput(String(payload.price))
            : current.normalPrice,
        imagePreview: payload.imageUrl || current.imagePreview,
        notes: current.notes || payload.description || "",
      }));

      if (foundFields === 0) {
        setProductImportInfo(
          "The link is accessible, but the webshop publishes limited product information. Please complete the missing fields manually."
        );
      } else {
        setProductImportInfo(
          `Product information retrieved${payload.currency && payload.currency !== "EUR" ? ` · price in ${payload.currency}` : ""}. Please check it before saving.`
        );
      }
    } catch (error) {
      setProductImportError(
        error instanceof Error
          ? error.message
          : "Product information could not be retrieved."
      );
    } finally {
      setImportingProduct(false);
    }
  }

  async function saveDraft(event: FormEvent) {
    if(readOnly) return;
    event.preventDefault();
    if (!draft.name.trim()) return;

    setSaveState("saving");
    setStorageError("");

    try {
      const uploadedImage = await uploadPendingImage();
      const existingItem = editingId
        ? items.find((item) => item.id === editingId)
        : null;

      let images = existingItem?.images ?? [];
      if (uploadedImage) {
        images = [uploadedImage, ...images];
      } else if (draft.imagePreview && !draft.imagePreview.startsWith("blob:")) {
        images = [
          draft.imagePreview,
          ...images.filter((image) => image !== draft.imagePreview),
        ];
      }

      const itemPayload = {
        itemNo:
          existingItem?.itemNo ||
          `ART.${String(items.length + 1).padStart(2, "0")}`,
        name: draft.name.trim(),
        category: draft.category,
        location: normalizeLocation(draft.location),
        placementLocation: draft.placementLocation.trim(),
        dimensions: draft.dimensions.trim(),
        purchasePrice: cleanNumber(draft.purchasePrice),
        normalPrice: cleanNumber(draft.normalPrice),
        quantity: Math.max(1, Math.round(cleanNumber(draft.quantity) || 1)),
        supplier: draft.supplier.trim(),
        status: draft.status,
        paymentStatus: draft.paymentStatus,
        productUrl: draft.productUrl.trim(),
        notes: draft.notes.trim(),
        images,
      };

      const response = await fetch(
        editingId ? `/api/furniture-items/${editingId}` : "/api/furniture-items",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload),
        }
      );
      const payload = (await response.json().catch(() => null)) as
        | { item?: FurnitureItem; error?: string }
        | null;

      if (!response.ok || !payload?.item) {
        throw new Error(payload?.error || "The item could not be saved.");
      }

      const savedItem = {
        ...payload.item,
        location: normalizeLocation(payload.item.location || ""),
      };

      if (editingId) {
        setItems((current) =>
          current.map((item) => (item.id === editingId ? savedItem : item))
        );
        flash("Item saved online");
      } else {
        setItems((current) => [savedItem, ...current]);
        flash("New item saved online");
      }

      setSaveState("saved");
      setShowForm(false);
      setEditingId(null);
      setPendingImageFile(null);
      setDraft(emptyDraft());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Saving failed.";
      setSaveState("error");
      setStorageError(message);
      flash(message);
    }
  }

  async function removeItem(id: string) {
    if(readOnly) return;
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    try {
      const response = await fetch(`/api/furniture-items/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "The item could not be deleted.");
      }

      setItems((current) => current.filter((entry) => entry.id !== id));
      flash("Item deleted");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Deleting failed.");
    }
  }

  async function assignProperty(id:string,nextProperty:string){
    if(readOnly||assigning.includes(id))return;
    setAssigning(current=>[...current,id]);
    try{
      const response=await fetch(`/api/furniture-items/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({placementLocation:nextProperty})});
      const payload=await response.json().catch(()=>null);
      if(!response.ok||!payload?.item)throw new Error(payload?.error||"The property assignment could not be saved.");
      setItems(current=>current.map(item=>item.id===id?{...item,placementLocation:payload.item.placementLocation??nextProperty}:item));
      flash(nextProperty?"Property assignment saved.":"Property assignment removed.");
    }catch(error){flash(error instanceof Error?error.message:"The property assignment could not be saved. Please try again.");}
    finally{setAssigning(current=>current.filter(value=>value!==id));}
  }

  async function updateQuickStatus(id: string, nextStatus: string) {
    if(readOnly) return;
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item
      )
    );
    setSaveState("saving");

    try {
      const response = await fetch(`/api/furniture-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { item?: FurnitureItem; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "The status could not be saved.");
      }

      setSaveState("saved");
    } catch (error) {
      setItems(previous);
      setSaveState("error");
      flash(error instanceof Error ? error.message : "Saving the status failed.");
    }
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
            <p className="eyebrow">L3 CAPITAL · INTERNAL TOOL</p>
            <h1>Furniture Procurement</h1>
            <p className="hero-copy">
              Visual furniture overview for selection, purchasing, delivery and installation.
            </p>
          </div>
          <div className="project-chip">
            <span>PROJECT</span>
            <strong>Furniture database</strong>
            <small>
              {loadingItems
                ? "Loading online data..."
                : storageError
                  ? "Storage error · check the message below"
                  : saveState === "saving"
                    ? "Saving..."
                    : "Saved online ✓"}
            </small>
          </div>
        </header>

        <section className="metric-grid">
          <Metric label="Purchase value" value={euro(totals.purchase)} />
          <Metric label="Retail value" value={euro(totals.normal)} />
          <Metric
            label="Savings vs. retail"
            value={euro(totals.savings)}
            accent
          />
          <Metric
            label="Delivered / installed"
            value={`${totals.delivered} / ${items.length}`}
          />
        </section>

        <section className="toolbar">
          <div className="filters">
            <label className="search-box">
              <span>⌕</span>
              <input data-portal-view-control
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search furniture, location, supplier..."
              />
            </label>

            <select data-portal-view-control value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>

            <select data-portal-view-control value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select data-portal-view-control value={location} onChange={(event) => setLocation(event.target.value)}>
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
                ▦ Gallery
              </button>
              <button
                className={view === "table" ? "active" : ""}
                onClick={() => setView("table")}
              >
                ☰ Table
              </button>
            </div>
            <button data-portal-edit disabled={readOnly} className="primary-button" onClick={()=>{setShowPropertyForm(true);setPropertyError("");}}>+ Add property</button>
            <button data-portal-edit disabled={readOnly} className="primary-button" onClick={openNewItem}>
              + New furniture item
            </button>
          </div>
        </section>

        {propertyError&&<p role="alert">{propertyError}</p>}
        {showPropertyForm&&<form onSubmit={saveProperty} style={{padding:20,border:"1px solid #d4cbbd",borderRadius:10,margin:"20px 0"}}><h2>Add property</h2><label>Property name or address<input autoFocus required maxLength={200} value={propertyName} disabled={propertyBusy} onChange={e=>setPropertyName(e.target.value)} style={{display:"block",padding:12,width:"100%",margin:"10px 0"}}/></label><p>This property is saved for everyone with Furniture access. Select it under Current location when adding a furniture item.</p><button className="primary-button" disabled={propertyBusy} type="submit">{propertyBusy?"Saving…":"Save property"}</button> <button type="button" disabled={propertyBusy} onClick={()=>setShowPropertyForm(false)}>Cancel</button></form>}
        <div className="result-line">
          <strong>{filtered.length}</strong> items shown
          {(search ||
            category !== "All categories" ||
            status !== "All statuses" ||
            location !== "All locations") && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("All categories");
                setStatus("All statuses");
                setLocation("All locations");
              }}
            >
              Clear filters
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
                  title={item.images[0] ? "Click to enlarge" : "No image"}
                >
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="image-placeholder">
                      <span>No image</span>
                      <small>Add a product image</small>
                    </div>
                  )}
                  {item.images.length > 0 && (
                    <div className="zoom-hint">⌕ Enlarge</div>
                  )}
                  {item.images.length > 1 && (
                    <div className="photo-count">{item.images.length} images</div>
                  )}
                </button>

                <div className="card-body">
                  <div className="card-meta">
                    <span className="category-pill">{item.category}</span>
                    <span>{item.itemNo}</span>
                  </div>
                  <h2>{item.name}</h2>
                  <p className="location">
                    {item.location ? `⌖ ${item.location}` : "Location not entered yet"}
                  </p>
                  <div className="item-detail-grid">
                    <div className="item-detail">
                      <span>Placement location</span>
                      <select
                        aria-label={"Placement location for "+item.name}
                        value={item.placementLocation||""}
                        disabled={readOnly||assigning.includes(item.id)}
                        onChange={event=>void assignProperty(item.id,event.target.value)}
                        style={{width:"100%",minWidth:0,padding:"7px 5px",border:"1px solid #d4cbbd",borderRadius:6,background:"white",fontSize:11}}
                      >
                        <option value="">Not assigned</option>
                        {Array.from(new Set([...locations.filter(entry=>entry!=="All locations"),item.placementLocation].filter(Boolean))).map(entry=><option key={entry} value={entry}>{entry}</option>)}
                      </select>
                      {assigning.includes(item.id)&&<small role="status">Saving…</small>}
                    </div>
                    <div className="item-detail">
                      <span>Dimensions</span>
                      <strong>{item.dimensions || "Not entered yet"}</strong>
                    </div>
                  </div>

                  <div className="price-grid">
                    <div>
                      <span>Purchase</span>
                      <strong>{euro(item.purchasePrice)}</strong>
                    </div>
                    <div>
                      <span>Retail value</span>
                      <strong>{euro(item.normalPrice)}</strong>
                    </div>
                  </div>

                  <div className="discount-row">
                    <span>Discount</span>
                    <strong>
                      {formatPercentage(
                        discountPercentage(item.purchasePrice, item.normalPrice)
                      )}
                    </strong>
                  </div>

                  <div className="card-status">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        updateQuickStatus(item.id, event.target.value)
                      }
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <span className={`payment payment-${item.paymentStatus.replace(/\s/g, "-").toLowerCase()}`}>
                      {paymentStatusLabel(item.paymentStatus)}
                    </span>
                  </div>

                  <div className="card-footer">
                    <button data-portal-edit disabled={readOnly} onClick={() => openEdit(item)}>Edit</button>
                    <button data-portal-edit disabled={readOnly} className="danger-link" onClick={() => removeItem(item.id)}>
                      Delete
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
                    <th>Image</th>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Current location</th>
                    <th>Placement location</th>
                    <th>Dimensions</th>
                    <th>Quantity</th>
                    <th>Purchase</th>
                    <th>Retail value</th>
                    <th>Status</th>
                    <th>Payment</th>
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
                      <td>{item.placementLocation || "—"}</td>
                      <td>{item.dimensions || "—"}</td>
                      <td>{item.quantity}</td>
                      <td>{euro(item.purchasePrice)}</td>
                      <td>{euro(item.normalPrice)}</td>
                      <td>
                        <select
                          className="table-select"
                          value={item.status}
                          onChange={(event) =>
                            updateQuickStatus(item.id, event.target.value)
                          }
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>{paymentStatusLabel(item.paymentStatus)}</td>
                      <td>
                        <button data-portal-edit disabled={readOnly} className="text-button" onClick={() => openEdit(item)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className={`prototype-note ${storageError ? "storage-error" : ""}`}>
          <strong>{storageError ? "Online storage requires attention" : "Online storage active"}</strong>
          <p>
            {storageError
              ? storageError
              : "Items, changes and uploaded images are stored in Supabase and remain available after refreshing. Integration with active projects can be added later."}
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
                <p className="eyebrow">{editingId ? "EDIT ITEM" : "NEW ITEM"}</p>
                <h2>{editingId ? "Edit furniture item" : "Add furniture item"}</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <div className="form-grid">
              <label className="wide">
                <span>Product / description</span>
                <input
                  required
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="e.g. Minotti sofa"
                />
              </label>

              <label>
                <span>Category</span>
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                >
                  {categories.filter((entry) => entry !== "All categories").map((entry) => (
                    <option key={entry}>{entry}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Current location</span>
                <select
                  value={draft.location}
                  onChange={(event) =>
                    setDraft({ ...draft, location: event.target.value })
                  }
                >
                  <option value="">Select location</option>
                  {Array.from(new Set([...locations.filter(entry=>entry!=="All locations"),draft.location].filter(Boolean))).map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Placement location</span>
                <select
                  value={draft.placementLocation}
                  onChange={(event) =>
                    setDraft({ ...draft, placementLocation: event.target.value })
                  }
                >
                  <option value="">Select property</option>
                  {Array.from(new Set([...locations.filter(entry=>entry!=="All locations"),draft.placementLocation].filter(Boolean))).map(entry=>(
                    <option key={entry} value={entry}>{entry}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Dimensions</span>
                <input
                  value={draft.dimensions}
                  onChange={(event) =>
                    setDraft({ ...draft, dimensions: event.target.value })
                  }
                  placeholder="e.g. 280 × 110 × 75 cm"
                />
              </label>

              <label>
                <span>Purchase price (total)</span>
                <input
                  value={draft.purchasePrice}
                  onChange={(event) =>
                    setDraft({ ...draft, purchasePrice: formatMoneyInput(event.target.value) })
                  }
                  placeholder="€ 0"
                  inputMode="decimal"
                />
              </label>

              <label>
                <span>Retail value (total)</span>
                <input
                  value={draft.normalPrice}
                  onChange={(event) =>
                    setDraft({ ...draft, normalPrice: formatMoneyInput(event.target.value) })
                  }
                  placeholder="€ 0"
                  inputMode="decimal"
                />
              </label>

              <label>
                <span>Quantity (informational)</span>
                <input
                  value={draft.quantity}
                  onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                  inputMode="numeric"
                />
              </label>

              <label>
                <span>Supplier</span>
                <input
                  value={draft.supplier}
                  onChange={(event) => setDraft({ ...draft, supplier: event.target.value })}
                  placeholder="Supplier"
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Payment status</span>
                <select
                  value={draft.paymentStatus}
                  onChange={(event) =>
                    setDraft({ ...draft, paymentStatus: event.target.value })
                  }
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="wide product-import-field">
                <span>Product link</span>
                <div className="product-import-row">
                  <input
                    value={draft.productUrl}
                    onChange={(event) => {
                      setDraft({ ...draft, productUrl: event.target.value });
                      setProductImportError("");
                      setProductImportInfo("");
                    }}
                    placeholder="https://webshop.nl/product/..."
                  />
                  <button
                    type="button"
                    className="import-button"
                    onClick={importProductFromUrl}
                    disabled={importingProduct}
                  >
                    {importingProduct ? "Retrieving..." : "Retrieve product information"}
                  </button>
                </div>
                <small className="field-help">
                  We try to automatically fill in the name, supplier, retail price, description and product image.
                </small>
                {productImportError && (
                  <small className="import-message error">{productImportError}</small>
                )}
                {productImportInfo && (
                  <small className="import-message success">{productImportInfo}</small>
                )}
              </label>

              <label className="wide">
                <span>Product image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                <small className="field-help">The image will be stored online when you save the item.</small>
                {draft.imagePreview && (
                  <img className="form-preview" src={draft.imagePreview} alt="Preview" />
                )}
              </label>

              <label className="wide">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  placeholder="Dimensions, colour, agreements, special details..."
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={saveState === "saving"}>
                {saveState === "saving"
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add item"}
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
                Image {lightbox.imageIndex + 1} / {activeLightboxItem.images.length}
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
        .item-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin: 8px 0 2px;
        }
        .item-detail {
          min-width: 0;
          padding: 8px 10px;
          border-radius: 10px;
          background: #f7f3eb;
          color: #706456;
        }
        .item-detail span {
          display: block;
          margin-bottom: 3px;
          font-size: 9px;
          font-weight: 700;
          color: #8c8174;
        }
        .item-detail strong {
          display: block;
          color: #2d241b;
          font-size: 11px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .price-grid > div {
          padding: 9px;
          background: #f8f5ef;
          border-radius: 10px;
        }
        .price-grid span { display: block; font-size: 9px; color: #8c8174; margin-bottom: 3px; }
        .price-grid strong { font-size: 13px; }
        .discount-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 7px;
          padding: 8px 10px;
          border-radius: 10px;
          background: #e8f0e6;
          color: #4f6d50;
          font-size: 11px;
        }
        .discount-row span { font-weight: 700; }
        .discount-row strong { font-size: 13px; color: #355b39; }
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
        .prototype-note.storage-error {
          border-color: #b45b51;
          background: #fff1ef;
          color: #7f2f28;
        }

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
        .product-import-field { gap: 7px; }
        .product-import-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: stretch;
        }
        .product-import-row input { min-width: 0; }
        .import-button {
          border: 1px solid #2a241d;
          background: #f2ecdf;
          color: #2a241d;
          border-radius: 10px;
          padding: 0 14px;
          min-height: 42px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }
        .import-button:hover:not(:disabled) { background: #e9dfcc; }
        .import-button:disabled { opacity: .55; cursor: wait; }
        .field-help {
          display: block;
          margin-top: 1px;
          color: #83786a;
          font-size: 10px;
          line-height: 1.45;
        }
        .import-message {
          display: block;
          margin-top: 2px;
          padding: 8px 10px;
          border-radius: 9px;
          font-size: 10px;
          line-height: 1.45;
        }
        .import-message.success { background: #edf4eb; color: #365d35; }
        .import-message.error { background: #faece8; color: #8a3a2f; }

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

        @media (max-width: 720px) {
          .product-import-row { grid-template-columns: 1fr; }
          .import-button { width: 100%; }
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
