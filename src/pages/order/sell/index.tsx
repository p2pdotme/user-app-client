import type { Order } from "@/core/adapters/thirdweb/validation";
import { SellAccepted } from "./accepted";
import { SellCancelled } from "./cancelled";
import { SellCompleted } from "./completed";
import { SellPaid } from "./paid";
import { SellPlaced } from "./placed";

export function Sell({ order }: { order: Order }) {
  switch (order.status) {
    case "PLACED":
      return <SellPlaced order={order} />;
    case "ACCEPTED":
      return <SellAccepted order={order} />;
    case "PAID":
      return <SellPaid order={order} />;
    case "COMPLETED":
      return <SellCompleted order={order} />;
    case "CANCELLED":
      return <SellCancelled order={order} />;
    default:
      return null;
  }
}
