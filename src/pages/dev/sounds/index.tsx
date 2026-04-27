import { AlertTriangle, CheckCircle, Volume2 } from "lucide-react";
import { NonHomeHeader } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSounds } from "@/hooks/use-sounds";

export function SoundsDemo() {
  const sounds = useSounds();

  const soundTests = [
    {
      key: "qrScan",
      label: "QR Scan Success",
      description: "QR code successfully scanned",
      handler: sounds.triggerQrScanSound,
    },
    {
      key: "success",
      label: "Success Sound",
      description: "All successful operations (orders, transactions)",
      handler: sounds.triggerSuccessSound,
    },
    {
      key: "failure",
      label: "Failure Sound",
      description: "All failed operations (orders, transactions)",
      handler: sounds.triggerFailureSound,
    },
  ];

  return (
    <>
      <NonHomeHeader title="Sound System" showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col overflow-y-auto py-8">
        {/* System Status */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="size-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {sounds.supportInfo.willTrigger ? (
                      <CheckCircle className="size-4 text-success" />
                    ) : (
                      <AlertTriangle className="size-4 text-warning" />
                    )}
                    <span className="font-medium text-sm">Playback Status</span>
                  </div>
                  <Badge
                    variant={
                      sounds.supportInfo.willTrigger ? "default" : "secondary"
                    }>
                    {sounds.supportInfo.willTrigger ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="size-4" />
                    <span className="font-medium text-sm">API Support</span>
                  </div>
                  <Badge
                    variant={
                      sounds.supportInfo.isAPIAvailable
                        ? "default"
                        : "destructive"
                    }>
                    {sounds.supportInfo.isAPIAvailable
                      ? "Available"
                      : "Not Available"}
                  </Badge>
                </div>
              </div>

              {sounds.supportInfo.reasons.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">Status Details:</span>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    {sounds.supportInfo.reasons.map((reason, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="size-1 rounded-full bg-current" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Sound Tests */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg">Test Sounds</h3>
          <div className="space-y-3">
            {soundTests.map((sound) => (
              <div
                key={sound.key}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="font-medium">{sound.label}</span>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {sound.description}
                  </p>
                </div>
                <Button
                  onClick={sound.handler}
                  variant="outline"
                  size="sm"
                  disabled={!sounds.supportInfo.willTrigger}
                  className="w-full sm:ml-4 sm:w-auto">
                  Test
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="mt-6">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-semibold">Usage Guidelines:</h4>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• QR Scan: Only for successful QR code scans</li>
              <li>
                • Success: Order completion, payment success, bridge success
              </li>
              <li>
                • Failure: Order cancellation, payment failure, bridge failure
              </li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
