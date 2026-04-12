"use client";

export default function StoriesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-3xl mx-auto mt-12 card text-center">
      <h2 className="text-xl font-bold mb-2">Story bank error</h2>
      <p className="text-[#888] text-sm mb-4">{error.message}</p>
      <button className="btn-primary" onClick={reset}>Reload</button>
    </div>
  );
}
