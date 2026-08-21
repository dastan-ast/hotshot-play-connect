import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Role } from "@/lib/mock-db";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  const { t } = useI18n();

  if (isAuthenticated && role && roles.includes(role)) return <>{children}</>;

  return (
    <div className="neon-panel mx-auto max-w-md p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/20 neon-glow">
        <Lock className="size-6 text-primary" />
      </span>
      <h1 className="mt-4 text-lg font-bold">{isAuthenticated ? t("auth.noAccess") : t("auth.needSignIn")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.needSignInHint")}</p>
      <Button asChild className="mt-5">
        <Link to="/auth">{t("auth.signin")}</Link>
      </Button>
    </div>
  );
}
