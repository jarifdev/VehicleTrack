export function formatQuantity(value: number | string): string {
  const numberValue = Number(value);
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 3,
  }).format(numberValue);
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function tripLabel(tripNumber: number): string {
  return `TRIP-${String(tripNumber).padStart(4, "0")}`;
}

export function movementLabel(type: string): string {
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
