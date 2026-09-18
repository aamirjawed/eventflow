import jwt from "jsonwebtoken";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";
const JWT_SECRET = process.env.BACKEND_JWT_SECRET || process.env.JWT_SECRET || "supersecret123_change_in_production";
const ADMIN_EMAIL = (process.env.ADMIN_EMAILS || "admin@example.com").split(",")[0].trim();

/**
 * Generate a valid admin token for backend server-to-server requests
 */
export function getBackendAdminToken(): string {
  return jwt.sign({ email: ADMIN_EMAIL }, JWT_SECRET, { expiresIn: "1d" });
}

/**
 * Standardize Express backend Registration document to EventFlow UI format
 */
export function normalizeRegistration(doc: any) {
  if (!doc) return null;

  const formData = doc.formData || {};
  const id = doc._id?.toString() || doc._id || doc.id;
  
  // Extract primary contact details dynamically from formData
  const name =
    formData.name ||
    formData.fullName ||
    formData.Name ||
    formData["Full Name"] ||
    formData.attendeeName ||
    "Attendee";

  const email =
    formData.email ||
    formData.emailAddress ||
    formData.Email ||
    formData["Email Address"] ||
    "";

  const phone =
    formData.phone ||
    formData.phoneNumber ||
    formData.Phone ||
    formData.mobile ||
    formData.Mobile ||
    "";

  const company =
    formData.company ||
    formData.organization ||
    formData.organisation ||
    formData.Company ||
    formData.designation ||
    formData.Designation ||
    "";

  const isCheckedIn = Boolean(doc.hasEntered);
  const checkedInAt = doc.scannedAt || (isCheckedIn ? doc.updatedAt || doc.createdAt : null);

  // Map backend registrationType & entry status to EventFlow statuses:
  // "checked_in" | "registered" (onsite) | "pre_registered" (online)
  let status: "checked_in" | "registered" | "pre_registered" = "pre_registered";
  if (isCheckedIn) {
    status = "checked_in";
  } else if (doc.registrationType === "onsite") {
    status = "registered";
  }

  return {
    _id: id,
    id: id,
    eventId: doc.eventId || "DEFAULT",
    name,
    email,
    phone,
    company,
    status,
    isCheckedIn,
    checkedInAt,
    customFields: formData,
    registrationType: doc.registrationType || "online",
    hasEntered: isCheckedIn,
    scannedAt: doc.scannedAt,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

/**
 * Fetch paginated & filtered registrations from event-registration-backend
 */
export async function getBackendRegistrations(params: {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
}) {
  const token = getBackendAdminToken();
  const url = new URL(`${BACKEND_URL}/api/registrations`);

  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.search) url.searchParams.set("search", params.search);
  
  // Map UI status filter to backend query
  if (params.status && params.status !== "all") {
    if (params.status === "checked_in") {
      url.searchParams.set("status", "checked-in");
    } else if (params.status === "registered") {
      url.searchParams.set("type", "onsite");
    } else if (params.status === "pre_registered") {
      url.searchParams.set("type", "online");
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Backend request failed (${res.status}): ${errText}`);
  }

  const result = await res.json();
  const rawList = Array.isArray(result.data) ? result.data : [];
  const normalized = rawList.map(normalizeRegistration);

  return {
    registrations: normalized,
    total: result.total || normalized.length,
    page: result.page || 1,
    pages: result.pages || 1,
    globalStats: result.globalStats || {
      totalUsers: 0,
      totalOnline: 0,
      totalOnsite: 0,
      totalCheckedIn: 0,
    },
  };
}

/**
 * Fetch a single registration by ID
 */
export async function getBackendRegistrationById(id: string) {
  const res = await fetch(`${BACKEND_URL}/api/registrations/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const result = await res.json();
  return normalizeRegistration(result.data || result.registration || result);
}

/**
 * Mark attendee as entered (checked in)
 */
export async function checkInBackendAttendee(id: string) {
  const res = await fetch(`${BACKEND_URL}/api/registrations/${id}/enter`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to check in: ${err}`);
  }
  return await res.json();
}

/**
 * Create registration in Express backend
 */
export async function createBackendRegistration(data: {
  eventId?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  customFields?: Record<string, any>;
  status?: string;
}) {
  const eventId = data.eventId || "EVENT_DEFAULT";
  const isOnsite = data.status === "registered" || data.status === "onsite";

  const formData = {
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    company: data.company || "",
    ...(data.customFields || {}),
  };

  const res = await fetch(`${BACKEND_URL}/api/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId,
      formData,
      registrationType: isOnsite ? "onsite" : "online",
      isOnsite,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create registration: ${err}`);
  }

  const result = await res.json();
  return normalizeRegistration(result.data || result);
}

/**
 * Delete registration in Express backend
 */
export async function deleteBackendRegistration(id: string) {
  const token = getBackendAdminToken();
  const res = await fetch(`${BACKEND_URL}/api/registrations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete registration: ${err}`);
  }
  return await res.json();
}
