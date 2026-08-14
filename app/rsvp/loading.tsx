export default function RsvpLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-ivory px-6 py-10 text-espresso sm:max-w-lg">
      <div
        aria-hidden="true"
        className="h-1 w-24 overflow-hidden rounded-full bg-taupe/25"
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-gold" />
      </div>
      <p className="mt-4 font-lora text-sm text-taupe" role="status">
        Loading your invitation...
      </p>
    </div>
  );
}
