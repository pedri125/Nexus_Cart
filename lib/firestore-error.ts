const FIRESTORE_DISABLED_MESSAGE = "Cloud Firestore API has not been used"
const ENABLE_URL =
  "https://console.cloud.google.com/apis/api/firestore.googleapis.com/overview?project=nexuscart-1254"

export function isFirestoreDisabledError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const e = error as { message?: string; details?: string; code?: number }
  const msg = e.message ?? e.details ?? ""
  return (
    e.code === 7 ||
    (typeof msg === "string" && msg.includes("Firestore"))
  )
}

export function firestoreDisabledResponse() {
  return {
    error:
      "Firestore no está habilitado. Activa la API en Google Cloud y crea la base de datos en Firebase Console.",
    code: "FIRESTORE_DISABLED",
    enableUrl: ENABLE_URL,
  }
}
