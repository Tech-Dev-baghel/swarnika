"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-5xl text-wine-800">Something went wrong</p>
      <p className="mt-3 text-ink/60">Please try again. If it keeps happening, call or WhatsApp us.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button onClick={reset} className="rounded-full bg-wine-700 px-7 py-3 text-sm text-white">Try again</button>
        <a href="/" className="rounded-full border border-wine-700 px-7 py-3 text-sm text-wine-700">Home</a>
      </div>
    </div>
  );
}
