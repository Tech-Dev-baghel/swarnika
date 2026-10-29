import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl text-wine-800">Lost a gem?</p>
      <p className="mt-3 text-ink/60">We couldn&apos;t find that page.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-wine-700 px-7 py-3 text-sm text-white">Back to home</Link>
    </div>
  );
}
