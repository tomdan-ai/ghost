import { AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

interface ErrorMessageProps {
  title: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({ title, message, retry }: ErrorMessageProps) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{title}</CardTitle>
        </div>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {retry && (
        <CardContent>
          <Button onClick={retry} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
