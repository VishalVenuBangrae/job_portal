import Location from "../models/Location.js";
const exact = (s) =>
  new RegExp(
    "^" + String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
    "i",
  );
export async function resolveCoordinates(location) {
  const found = await Location.findOne({
    country: exact(location.country),
    city: exact(location.city),
    port: exact(location.port),
    isActive: true,
  })
    .select("coordinates")
    .lean();
  if (
    found?.coordinates &&
    Number.isFinite(found.coordinates.latitude) &&
    Number.isFinite(found.coordinates.longitude)
  )
    return found.coordinates;
  return undefined;
}
