import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import type { QRParserError } from "@p2pdotme/sdk/qr-parsers";
import { RotateCcw } from "lucide-react";
import type { Result } from "neverthrow";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { NonHomeHeader, QrScanner } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ParsedQR } from "@/lib/qr-parsers";
import { parseQRData } from "@/lib/qr-parsers";
import { cn } from "@/lib/utils";

// Dev constant prices for testing
const DEV_PRICES = {
  INR: { buy: 91, sell: 89 },
  IDR: { buy: 17000, sell: 16950 },
  BRL: { buy: 6.14, sell: 6.0 },
  ARS: { buy: 1000, sell: 980 },
  MEX: { buy: 20.5, sell: 20.0 },
  VEN: { buy: 40, sell: 39 },
} as const;

export function ScannerDevDashboard() {
  const { t } = useTranslation();
  const [parsedResult, setParsedResult] = useState<Result<
    ParsedQR,
    QRParserError
  > | null>(null);
  const [rawQRData, setRawQRData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState<CurrencyType>("INR");

  const handleQrScan = async (data: string) => {
    if (!data?.trim()) {
      toast.warning(t("INVALID_QR_DATA"));
      return;
    }

    setIsProcessing(true);
    setRawQRData(data);

    try {
      const sellPrice = DEV_PRICES[currency as keyof typeof DEV_PRICES].sell;

      console.log("[ScannerDevDashboard] calling parseQRData with: ", {
        data,
        currency,
        sellPrice,
        orderId: "dev-test",
      });

      // Parse QR data
      const result = await parseQRData(data, currency, sellPrice, "dev-test");

      setParsedResult(result);

      result.match(
        () => toast.success(t("QR_PARSED_SUCCESSFULLY")),
        (error) =>
          toast.error(t(error.code), {
            description: t(error.message),
          }),
      );
    } catch (err) {
      toast.error(t("PROCESSING_FAILED"), {
        description: err instanceof Error ? err.message : t("UNKNOWN_ERROR"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setParsedResult(null);
    setRawQRData(null);
    setIsProcessing(false);
  };

  const hasResults = parsedResult || rawQRData;

  return (
    <>
      <NonHomeHeader title="QR Debug" showHelp={false} />
      <main className="container-narrow flex h-full flex-col overflow-y-auto py-4">
        {/* Controls & Scanner */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>QR Scanner</CardTitle>
              {hasResults && (
                <Button
                  onClick={reset}
                  variant="outline"
                  size="sm"
                  className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency Selection */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <RadioGroup
                value={currency}
                onValueChange={(value) => setCurrency(value as CurrencyType)}
                className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INR" id="inr" />
                  <Label htmlFor="inr">INR (UPI)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="IDR" id="idr" />
                  <Label htmlFor="idr">IDR (QRIS)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BRL" id="brl" />
                  <Label htmlFor="brl">BRL (PIX)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ARS" id="ars" />
                  <Label htmlFor="ars">ARS (Transferencia)</Label>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MEX" id="mex" />
                  <Label htmlFor="mex">MEX (SPEI)</Label>
                </div> */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="VEN" id="ven" />
                  <Label htmlFor="ven">VEN (Pago Movil)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Price Status */}
            <div className="flex items-center justify-between text-sm">
              <span>Dev Sell Price:</span>
              <span className="font-medium text-green-600">
                {DEV_PRICES[currency as keyof typeof DEV_PRICES].sell}{" "}
                {currency}
              </span>
            </div>

            {/* Scanner */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <QrScanner onScan={handleQrScan} className="w-full" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {isProcessing ? "Processing QR..." : `Scan ${currency} QR code`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasResults && (
          <div className="space-y-4">
            {/* Raw Data */}
            <Card>
              <CardHeader>
                <CardTitle>Raw QR Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
                  {rawQRData}
                </pre>
              </CardContent>
            </Card>

            {/* Parsed Result */}
            {parsedResult && (
              <Card>
                <CardHeader>
                  <CardTitle
                    className={cn(
                      parsedResult.isOk() ? "text-green-600" : "text-red-600",
                    )}>
                    {parsedResult.isOk()
                      ? "✓ Parsed Successfully"
                      : "✗ Parse Failed"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedResult.match(
                    (value) => (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="font-medium">Payment Address:</span>
                          <span className="break-all">
                            {value.paymentAddress}
                          </span>
                        </div>
                        {value.amount && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <span className="font-medium">Fiat Amount:</span>
                              <span>
                                {value.amount.fiat} {currency}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <span className="font-medium">USDC Amount:</span>
                              <span>{value.amount.usdc.toFixed(6)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ),
                    (error) => (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="font-medium">Error Code:</span>
                          <span className="text-red-600">{error.code}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="font-medium">Message:</span>
                          <span className="break-words text-red-600">
                            {error.message}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </>
  );
}
