export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} animate-spin border-4 border-gba-border border-t-transparent rounded-full`} />
      {message && <p className="font-sans text-gba-text text-sm">{message}</p>}
    </div>
  );
}
