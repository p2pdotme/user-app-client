import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSounds } from "@/hooks";

export function ComprehensiveSoundTest() {
  const sounds = useSounds();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testCategories = [
    {
      title: "Direct Sound Tests",
      tests: [
        {
          name: "QR Scan",
          action: () => {
            sounds.triggerQrScanSound();
            addTestResult("QR scan sound triggered");
          },
        },
        {
          name: "Success",
          action: () => {
            sounds.triggerSuccessSound();
            addTestResult("Success sound triggered");
          },
        },
        {
          name: "Failure",
          action: () => {
            sounds.triggerFailureSound();
            addTestResult("Failure sound triggered");
          },
        },
      ],
    },
    {
      title: "QR Operations",
      tests: [
        {
          name: "QR Scan Success",
          action: () => {
            sounds.triggerQrScanSound();
            addTestResult("QR scan success sound triggered");
          },
        },
        {
          name: "QR Scan Failure",
          action: () => {
            sounds.triggerFailureSound();
            addTestResult("QR scan failure sound triggered");
          },
        },
      ],
    },
    {
      title: "Order Operations",
      tests: [
        {
          name: "Order Placed",
          action: () => {
            sounds.triggerSuccessSound();
            addTestResult("Order placed sound triggered");
          },
        },
        {
          name: "Order Failed",
          action: () => {
            sounds.triggerFailureSound();
            addTestResult("Order failed sound triggered");
          },
        },
        {
          name: "Payment Marked",
          action: () => {
            sounds.triggerSuccessSound();
            addTestResult("Payment marked sound triggered");
          },
        },
        {
          name: "Payment Failed",
          action: () => {
            sounds.triggerFailureSound();
            addTestResult("Payment failed sound triggered");
          },
        },
      ],
    },
    {
      title: "Bridge Operations",
      tests: [
        {
          name: "Bridge Success",
          action: () => {
            sounds.triggerSuccessSound();
            addTestResult("Bridge success sound triggered");
          },
        },
        {
          name: "Bridge Failure",
          action: () => {
            sounds.triggerFailureSound();
            addTestResult("Bridge failure sound triggered");
          },
        },
      ],
    },
  ];

  const runAllTests = () => {
    testCategories.forEach((category) => {
      category.tests.forEach((test) => {
        setTimeout(() => {
          test.action();
        }, Math.random() * 1000); // Random delay to spread out sounds
      });
    });
    addTestResult("All tests triggered");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl">Comprehensive Sound Test</h1>
        <p className="text-muted-foreground">
          Test all sound interactions and patterns
        </p>
      </div>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  sounds.supportInfo.isAPIAvailable ? "default" : "destructive"
                }>
                API{" "}
                {sounds.supportInfo.isAPIAvailable
                  ? "Available"
                  : "Unavailable"}
              </Badge>
              <Badge
                variant={
                  !sounds.supportInfo.isDisabledByUser ? "default" : "secondary"
                }>
                User{" "}
                {!sounds.supportInfo.isDisabledByUser ? "Enabled" : "Disabled"}
              </Badge>
              <Badge
                variant={
                  sounds.supportInfo.willTrigger ? "default" : "outline"
                }>
                Will {sounds.supportInfo.willTrigger ? "Play" : "Not Play"}
              </Badge>
            </div>
            {sounds.supportInfo.reasons.length > 0 && (
              <div className="text-muted-foreground text-sm">
                <p>Reasons:</p>
                <ul className="ml-4 list-disc">
                  {sounds.supportInfo.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Categories */}
      {testCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <CardTitle className="text-lg">{category.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {category.tests.map((test) => (
                <Button
                  key={test.name}
                  variant="outline"
                  size="sm"
                  onClick={test.action}
                  disabled={!sounds.supportInfo.willTrigger}>
                  {test.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Control Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={!sounds.supportInfo.willTrigger}>
              Run All Tests
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto rounded-lg bg-muted p-3">
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index}>{result}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
