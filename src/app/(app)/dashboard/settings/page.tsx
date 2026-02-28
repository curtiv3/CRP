import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = {
  title: "Settings — ContentRepurpose",
};

export default async function SettingsPage() {
  const context = await requireUserContext();

  // passwordHash is omitted from UserContext — query separately
  const user = await prisma.user.findUnique({
    where: { id: context.userId },
    select: { passwordHash: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Settings</h1>
      <SettingsForm
        name={context.user.name ?? ""}
        email={context.user.email}
        tier={context.user.subscriptionTier}
        hasPassword={!!user?.passwordHash}
      />
    </div>
  );
}
