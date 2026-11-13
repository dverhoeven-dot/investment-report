import "server-only";

import { cookies } from "next/headers";
import { COOKIE } from "@/lib/portal/auth";
import { sessionUser } from "@/lib/portal/store";

export async function currentPortalActor() {
  const token = (await cookies()).get(COOKIE)?.value;
  const user = await sessionUser(token);

  return {
    id: user?.id ?? "",
    name: user?.name?.trim() || user?.email?.trim() || "Unknown user",
  };
}
