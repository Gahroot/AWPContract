import { type VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { CONTRACT_STATUSES } from "@/lib/constants";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface ContractStatusBadgeProps {
  status: keyof typeof CONTRACT_STATUSES;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = CONTRACT_STATUSES[status] ?? CONTRACT_STATUSES.DRAFT;

  return (
    <Badge variant={config.color as BadgeVariant}>
      {config.label}
    </Badge>
  );
}
