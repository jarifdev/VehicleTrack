import Link from "next/link";

export default function NotFound() {
  return <div className="card error-panel"><h1>Page not found</h1><p>The requested record or page does not exist.</p><Link className="button button-primary" href="/">Return to dashboard</Link></div>;
}
