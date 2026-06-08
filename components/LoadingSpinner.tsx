export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
    </div>
  );
}
