"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import Loader from "@/components/Loader";

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    loading,
    isAuthenticated,
    hasPharmacy,
    isSubscriptionActive
  } = useAuth();

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const redirectUser = async () => {
      if (redirecting || loading) return;

      const validPaths = [
        "/login",
        "/signup",
        "/authSetup",
        "/payment-waiting",
        "/subscriptionExp",
        "/dashboard"
      ];

      if (validPaths.includes(pathname)) return;

      setRedirecting(true);

      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      if (!hasPharmacy) {
        router.push("/authSetup");
        return;
      }

      if (!isSubscriptionActive) {
        router.push("/payment-waiting");
        return;
      }

      router.push("/dashboard");
    };

    if (!loading) {
      redirectUser();
    }
  }, [
    loading,
    isAuthenticated,
    hasPharmacy,
    isSubscriptionActive,
    router,
    redirecting,
    pathname
  ]);

  return (
    <>
      {/* SEO BRAND CONTENT (Google reads this) */}
      <main className="sr-only">
        <h1>INGOBOKAINC</h1>
        <p>
          IngobokaInc ni sisitemu yo gucunga farumasi ifasha kugenzura
          imiti, ububiko, n’igihe imiti izarangirira mu buryo bwikora.
        </p>
      </main>

      {/* User sees loader only */}
      <Loader />
    </>
  );
}
