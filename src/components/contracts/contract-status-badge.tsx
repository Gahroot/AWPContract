import { Badge } from "@/components/ui/badge";
import { CONTRACT_STATUSES } from "@/lib/constants";

interface ContractStatusBadgeProps {
  status: keyof typeof CONTRACT_STATUSES;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = CONTRACT_STATUSES[status] ?? CONTRACT_STATUSES.DRAFT;

  return (
    <Badge variant={config.color as any}>
      {config.label}
    </Badge>
  );
}
