type SupabaseLike = {
  from: (table: string) => any;
};

export type ActivityInput = {
  itemId?: string | null;
  itemName: string;
  action: "created" | "updated" | "deleted" | "property_added";
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  actorName?: string;
};


export async function writeActivity(
  supabase: SupabaseLike,
  entry: ActivityInput
) {
  const { error } = await supabase.from("furniture_activity_log").insert({
    furniture_item_id: entry.itemId || null,
    item_name: entry.itemName.trim() || "Unnamed item",
    action: entry.action,
    field_name: entry.fieldName?.trim() || "",
    old_value: entry.oldValue ?? "",
    new_value: entry.newValue ?? "",
    actor_name: entry.actorName?.trim() || "Unknown user",
  });

  if (error) {
    // Do not make furniture editing fail if only audit logging fails.
    console.error("Failed to write furniture activity log", error);
  }
}

export function activityValue(field: string, value: unknown) {
  if (field === "status") {
    const labels: Record<string, string> = {
      Geselecteerd: "Selected",
      "Offerte aangevraagd": "Quote requested",
      Besteld: "Ordered",
      Aanbetaling: "Deposit paid",
      Onderweg: "In transit",
      Geleverd: "Delivered",
      Geplaatst: "Installed",
    };
    return labels[String(value ?? "")] ?? String(value ?? "");
  }
  if (field === "paymentStatus") {
    const labels: Record<string, string> = {
      "Niet betaald": "Unpaid",
      Aanbetaling: "Deposit paid",
      "Volledig betaald": "Paid in full",
    };
    return labels[String(value ?? "")] ?? String(value ?? "");
  }
  if (field === "images") {
    return `${Array.isArray(value) ? value.length : 0} image${Array.isArray(value) && value.length === 1 ? "" : "s"}`;
  }
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export const activityFieldMap: Record<
  string,
  { db: string; label: string }
> = {
  itemNo: { db: "item_no", label: "Item number" },
  name: { db: "name", label: "Product name" },
  category: { db: "category", label: "Category" },
  location: { db: "location", label: "Current location" },
  placementLocation: { db: "placement_location", label: "Placement location" },
  dimensions: { db: "dimensions", label: "Dimensions" },
  purchasePrice: { db: "purchase_price", label: "Purchase price" },
  normalPrice: { db: "normal_price", label: "Retail value" },
  quantity: { db: "quantity", label: "Quantity" },
  status: { db: "status", label: "Status" },
  paymentStatus: { db: "payment_status", label: "Payment status" },
  supplier: { db: "supplier", label: "Supplier" },
  productUrl: { db: "product_url", label: "Product link" },
  expectedDelivery: { db: "expected_delivery", label: "Expected delivery" },
  notes: { db: "notes", label: "Notes" },
  images: { db: "images", label: "Images" },
};
