export function StatusBadge({ status }: { status: "out" | "returned" }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === "out" ? "Currently out" : "Returned"}
    </span>
  );
}
