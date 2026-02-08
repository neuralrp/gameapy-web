import { Button } from '../ui/button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-lg">
      <p className="font-sans text-sm">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="mt-2"
          variant="secondary"
          size="sm"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
