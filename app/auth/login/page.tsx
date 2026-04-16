import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign In — Event Planner",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <LoginPageContent searchParams={searchParams} />
  );
}

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return <AuthForm mode="login" callbackUrl={callbackUrl} />;
}
