import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  CreditCard,
  Settings,
  ShoppingBag,
  Smartphone,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { NumpadInput } from "@/components/numpad-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHapticInteractions, useHaptics } from "@/hooks";

/**
 * Comprehensive Haptic Integration Test Suite
 *
 * This component tests all haptic feedback implementations across the app:
 * - Core UI Components (Button, Checkbox, Select)
 * - Transaction Flows (Buy, Sell, Pay)
 * - Order Management
 * - Settings & Configuration
 * - QR Scanning & Address Management
 * - Navigation & Help Actions
 */
export function ComprehensiveHapticTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { supportInfo } = useHaptics();
  const hapticInteractions = useHapticInteractions();

  const logTest = (testName: string, success: boolean = true) => {
    setTestResults((prev) => ({ ...prev, [testName]: success }));
    console.log(`🧪 Haptic Test: ${testName} - ${success ? "PASS" : "FAIL"}`);
  };

  // Core UI Component Tests
  const CoreUITests = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Core UI Components
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Button Tests */}
        <div className="space-y-2">
          <h4 className="font-semibold">Enhanced Button Component</h4>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => logTest("Button: Default Tap")} size="sm">
              Default (Tap)
            </Button>
            <Button
              hapticType="success"
              onClick={() => logTest("Button: Success")}
              size="sm">
              Success
            </Button>
            <Button
              hapticType="error"
              variant="destructive"
              onClick={() => logTest("Button: Error")}
              size="sm">
              Error
            </Button>
            <Button
              hapticType="warning"
              variant="outline"
              onClick={() => logTest("Button: Warning")}
              size="sm">
              Warning
            </Button>
            <Button
              hapticFeedback={false}
              variant="ghost"
              onClick={() => logTest("Button: Silent")}
              size="sm">
              Silent
            </Button>
          </div>
        </div>

        {/* Checkbox Tests */}
        <div className="space-y-2">
          <h4 className="font-semibold">Enhanced Checkbox Component</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comp-haptic-checkbox"
                onCheckedChange={() => logTest("Checkbox: With Haptic")}
              />
              <label htmlFor="comp-haptic-checkbox" className="text-sm">
                Checkbox with haptic feedback
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comp-silent-checkbox"
                hapticFeedback={false}
                onCheckedChange={() => logTest("Checkbox: Silent")}
              />
              <label htmlFor="comp-silent-checkbox" className="text-sm">
                Silent checkbox
              </label>
            </div>
          </div>
        </div>

        {/* Select Tests */}
        <div className="space-y-2">
          <h4 className="font-semibold">Enhanced Select Component</h4>
          <div className="flex gap-2">
            <Select onValueChange={() => logTest("Select: With Haptic")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="With haptic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Option 1</SelectItem>
                <SelectItem value="2">Option 2</SelectItem>
              </SelectContent>
            </Select>
            <Select
              hapticFeedback={false}
              onValueChange={() => logTest("Select: Silent")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Silent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Option 1</SelectItem>
                <SelectItem value="2">Option 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Transaction Flow Tests
  const TransactionFlowTests = () => {
    const [numpadValue, setNumpadValue] = useState("");

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Transaction Flows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* NumpadInput Test */}
          <div className="space-y-2">
            <h4 className="font-semibold">Enhanced NumpadInput Component</h4>
            <div className="space-y-2 rounded-lg border p-4">
              <div className="min-h-[2rem] text-center font-bold text-2xl">
                {numpadValue || "0"}
              </div>
              <div style={{ height: "200px" }}>
                <NumpadInput
                  onChange={(value) => {
                    setNumpadValue((prev) => prev + value);
                    logTest("Numpad: Number Entry");
                  }}
                  onMax={() => {
                    setNumpadValue("100");
                    logTest("Numpad: Max");
                  }}
                  onClear={() => {
                    setNumpadValue("");
                    logTest("Numpad: Clear");
                  }}
                  onDelete={() => {
                    setNumpadValue((prev) => prev.slice(0, -1));
                    logTest("Numpad: Delete");
                  }}
                />
              </div>
            </div>
          </div>

          {/* Transaction Actions */}
          <div className="space-y-2">
            <h4 className="font-semibold">Transaction Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  hapticInteractions.onCurrencyToggle();
                  logTest("Transaction: Currency Toggle");
                }}
                variant="outline"
                size="sm">
                Currency Toggle
              </Button>
              <Button
                onClick={() => {
                  hapticInteractions.onValidationError();
                  logTest("Transaction: Validation Error");
                }}
                variant="destructive"
                size="sm">
                Validation Error
              </Button>
              <Button
                onClick={() => {
                  hapticInteractions.onContinue();
                  logTest("Transaction: Continue");
                }}
                size="sm">
                Continue Action
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Order Management Tests
  const OrderManagementTests = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Order Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Order Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                hapticInteractions.onOrderPlaced();
                logTest("Order: Placed Successfully");
              }}
              hapticType="success"
              size="sm">
              Order Placed
            </Button>
            <Button
              onClick={() => {
                hapticInteractions.onOrderFailed();
                logTest("Order: Failed");
              }}
              hapticType="error"
              variant="destructive"
              size="sm">
              Order Failed
            </Button>
            <Button
              onClick={() => {
                hapticInteractions.onPaymentMarked();
                logTest("Order: Payment Marked");
              }}
              hapticType="success"
              size="sm">
              Payment Marked
            </Button>
            <Button
              onClick={() => {
                hapticInteractions.onPaymentFailed();
                logTest("Order: Payment Failed");
              }}
              hapticType="error"
              variant="destructive"
              size="sm">
              Payment Failed
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">QR Scanning</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                hapticInteractions.onQRScanned();
                logTest("QR: Scan Success");
              }}
              hapticType="success"
              size="sm">
              QR Scanned Successfully
            </Button>
            <Button
              onClick={() => {
                hapticInteractions.onQRError();
                logTest("QR: Scan Error");
              }}
              hapticType="error"
              variant="destructive"
              size="sm">
              QR Scan Error
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Settings & Configuration Tests
  const SettingsTests = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings & Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Settings Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                hapticInteractions.onSettingChange();
                logTest("Settings: Change");
              }}
              size="sm">
              Setting Change
            </Button>
            <Button
              onClick={() => {
                hapticInteractions.onSettingSaved();
                logTest("Settings: Saved");
              }}
              hapticType="success"
              size="sm">
              Settings Saved
            </Button>
            <Button
              onClick={() => {
                hapticInteractions.onSettingError();
                logTest("Settings: Error");
              }}
              hapticType="error"
              variant="destructive"
              size="sm">
              Settings Error
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Navigation</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                hapticInteractions.onNavigate();
                logTest("Navigation: Standard");
              }}
              variant="outline"
              size="sm">
              Navigate
            </Button>
            <Button
              onClick={() => {
                hapticInteractions.onBack();
                logTest("Navigation: Back");
              }}
              variant="outline"
              size="sm">
              Back
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Test Results Summary
  const TestResults = () => {
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Tests Executed:</span>
            <Badge variant="outline">{totalTests}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Tests Passed:</span>
            <Badge
              variant={passedTests === totalTests ? "default" : "destructive"}>
              {passedTests}
            </Badge>
          </div>

          {totalTests > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Test Log:</h4>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {Object.entries(testResults).map(([test, passed]) => (
                  <div key={test} className="flex items-center gap-2 text-sm">
                    {passed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        passed
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }>
                      {test}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setTestResults({})}
            variant="outline"
            size="sm"
            className="w-full">
            Clear Results
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-2xl">
          Comprehensive Haptic Integration Test
        </h1>
        <p className="text-muted-foreground">
          Test all haptic feedback implementations across the P2P.me app
        </p>
      </div>

      {/* Device Support Status */}
      <Alert variant={supportInfo.willTrigger ? "default" : "destructive"}>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium">
              Haptic Support: {supportInfo.willTrigger ? "Active" : "Inactive"}
            </div>
            <div className="text-sm">
              {supportInfo.reasons.map((reason, index) => (
                <div key={index}>• {reason}</div>
              ))}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="core" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="core">Core UI</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-4">
          <CoreUITests />
          <TestResults />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionFlowTests />
          <TestResults />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrderManagementTests />
          <TestResults />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SettingsTests />
          <TestResults />
        </TabsContent>
      </Tabs>

      <div className="text-center text-muted-foreground text-sm">
        💡 For best results, test on a mobile device with haptic feedback
        capability
      </div>
    </div>
  );
}
