import { getUser } from "@/lib/auth";
import { ImpersonationBanner } from "@/app/admin/components/impersonation-banner";

export default async function LandingPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isImpersonating } = await getUser();

  return (
    <>
      {isImpersonating && user && (
        <ImpersonationBanner impersonatedUserName={user.name || user.email} />
      )}
      {children}
    </>
  );
}
