// Shown instantly while a page's data loads, so slow connections never see a blank screen.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-16 pt-20" aria-busy="true">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    </main>
  );
}
