"use client";

export default function EvaluateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto mt-12 card text-center">
      <div className="text-3xl mb-4">◎</div>
      <h2 className="text-xl font-bold mb-2">Evaluation failed</h2>
      <p className="text-[#888] text-sm mb-4">{error.message}</p>
      <button className="btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
