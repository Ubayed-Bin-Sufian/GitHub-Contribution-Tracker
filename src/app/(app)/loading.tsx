export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="card h-36 animate-pulse bg-canvas-hover" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="card h-28 animate-pulse bg-canvas-hover" />
        ))}
      </div>
    </div>
  );
}
