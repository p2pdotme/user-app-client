import type { Order } from "@/core/adapters/thirdweb/validation";
import { BuyAccepted } from "./accepted";
import { BuyCancelled } from "./cancelled";
import { BuyCompleted } from "./completed";
import { BuyPaid } from "./paid";
import { BuyPlaced } from "./placed";

export function Buy({ order }: { order: Order }) {
  switch (order.status) {
    case "PLACED":
      return <BuyPlaced order={order} />;
    case "ACCEPTED":
      return <BuyAccepted order={order} />;
    case "PAID":
      return <BuyPaid order={order} />;
    case "COMPLETED":
      return <BuyCompleted order={order} />;
    case "CANCELLED":
      return <BuyCancelled order={order} />;
    default:
      return null;
  }
}
