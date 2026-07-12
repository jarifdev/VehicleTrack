"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card error-panel">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button className="button button-primary" onClick={reset}>Try again</button>
    </div>
  );
}
