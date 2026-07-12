import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/items", label: "Stock" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/trips/new", label: "Start trip" },
  { href: "/trips/out", label: "Trips out" },
  { href: "/trips/history", label: "Trip history" },
  { href: "/movements", label: "Stock movements" },
];

export function AppNav() {
  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        VehicleTrack
      </Link>
      <nav className="nav-list" aria-label="Main navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="nav-link">
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
