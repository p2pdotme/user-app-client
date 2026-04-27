import type { Order } from "@/core/adapters/thirdweb/validation";
import { PayAccepted } from "./accepted";
import { PayCancelled } from "./cancelled";
import { PayCompleted } from "./completed";
import { PayPaid } from "./paid";
import { PayPlaced } from "./placed";

export function Pay({ order }: { order: Order }) {
  switch (order.status) {
    case "PLACED":
      return <PayPlaced order={order} />;
    case "ACCEPTED":
      return <PayAccepted order={order} />;
    case "PAID":
      return <PayPaid order={order} />;
    case "COMPLETED":
      return <PayCompleted order={order} />;
    case "CANCELLED":
      return <PayCancelled order={order} />;
    default:
      return null;
  }
}
