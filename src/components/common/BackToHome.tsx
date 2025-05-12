import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function BackToHome({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("fixed top-4 right-4 z-50", className)}>
      <Button variant="ghost" size="icon" aria-label="Home">
        <Home className="h-5 w-5" />
      </Button>
    </Link>
  );
}
