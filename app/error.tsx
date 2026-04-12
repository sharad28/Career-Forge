"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto mt-24 card text-center">
      <div className="text-3xl mb-4">⚠</div>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-[#888] text-sm mb-4">{error.message}</p>
      <button className="btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
