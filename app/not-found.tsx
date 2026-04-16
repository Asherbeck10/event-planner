import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-6xl">404</p>
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-block mt-2">
          Go Home
        </Link>
      </div>
    </div>
  );
}
