import moment from "moment";
import { ActionDeposit } from "@/assets/icons/action-deposit";
import { ActionSupport } from "@/assets/icons/action-support";
import { ActionWallet } from "@/assets/icons/action-wallet";
import { NonHomeHeader } from "@/components/non-home-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const notifications = [
  {
    id: 1,
    title: "Watch a movie, get 90% back with p2p.me!",
    description:
      "Use p2p.me to book any movie ticket, snap a photo of it, and share it on Twitter with your Order ID. We'll send you 90% of the ticket cost back to your wallet. It's that simple! Make your next movie night almost free — but hurry, this offer won't last long.",
    icon: (
      <ActionWallet className="size-10 rounded-xl bg-muted p-2 text-primary" />
    ),
    unread: true,
    createdAt: moment().subtract(4, "days").toISOString(),
  },
  {
    id: 2,
    title: "Introducing Scan & Pay – Try It Out Now!",
    description:
      "We just added a new Scan & Pay feature to make transactions even smoother. Simply scan any QR to pay with USDC instantly. Give it a try and share your feedback — we're excited to hear what you think!",
    icon: (
      <ActionDeposit className="size-10 rounded-xl bg-muted p-2 text-primary" />
    ),
    unread: true,
    createdAt: moment().subtract(4, "days").toISOString(),
  },
  {
    id: 3,
    title: "We're Making Things Better – Temporary Maintenance Ongoing",
    description:
      "We're performing scheduled maintenance to improve your p2p.me experience. Some features may be temporarily unavailable. Thanks for your patience — we'll be back shortly, faster and better than ever!",
    icon: (
      <ActionSupport className="size-10 rounded-xl bg-muted p-2 text-primary" />
    ),
    unread: false,
    createdAt: moment().subtract(4, "days").toISOString(),
  },
];

export function NotificationPage() {
  return (
    <>
      <NonHomeHeader title="Notifications" />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto py-8">
        <div className="flex flex-col">
          {notifications.map((n, i) => (
            <div key={n.id}>
              <Card className="flex flex-row items-start gap-4 border-none bg-background px-4 py-0 shadow-none">
                <div className="relative mt-1 flex items-center gap-2">
                  {n.unread && (
                    <span className="relative">
                      <span className="block size-2 rounded-full bg-destructive" />
                    </span>
                  )}
                  {n.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-regular text-foreground text-md leading-tight">
                      {n.title}
                    </h3>
                    <span className="whitespace-nowrap text-muted-foreground text-xs">
                      {moment(n.createdAt).fromNow()}
                    </span>
                  </div>
                  <p className="mt-1 font-light text-muted-foreground text-sm leading-tight">
                    {n.description}
                  </p>
                  {n.unread && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0 font-medium text-primary text-sm">
                      Mark as read
                    </Button>
                  )}
                </div>
              </Card>
              {i < notifications.length - 1 && (
                <Separator className="mx-4 my-6" />
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
