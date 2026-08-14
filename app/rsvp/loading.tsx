export default function RsvpLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-parchment px-6 py-10 text-mocha sm:max-w-lg">
      <div
        aria-hidden="true"
        className="h-1 w-24 overflow-hidden bg-sand/25"
      >
        <div className="h-full w-1/3 animate-pulse bg-peach" />
      </div>
      <p className="mt-4 font-playfair text-sm text-sand" role="status">
        Loading your invitation...
      </p>
    </div>
  );
}
