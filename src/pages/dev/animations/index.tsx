import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Film, Pause, Play, RotateCcw, Settings } from "lucide-react";
import { useState } from "react";
import ASSETS from "@/assets";
import { NonHomeHeader } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AnimationKey = keyof typeof ASSETS.ANIMATIONS;

interface AnimationConfig {
  autoplay: boolean;
  loop: boolean;
  speed: number;
  width: number;
  height: number;
}

const DEFAULT_CONFIG: AnimationConfig = {
  autoplay: true,
  loop: true,
  speed: 1,
  width: 200,
  height: 200,
};

export function AnimationsDemo() {
  const [selectedAnimation, setSelectedAnimation] =
    useState<AnimationKey>("ORDER_ASSIGNMENT");
  const [config, setConfig] = useState<AnimationConfig>(DEFAULT_CONFIG);
  const [playbackState, setPlaybackState] = useState<"playing" | "paused">(
    "playing",
  );

  const animationEntries = Object.entries(ASSETS.ANIMATIONS) as [
    AnimationKey,
    string,
  ][];

  const updateConfig = (updates: Partial<AnimationConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    setPlaybackState("playing");
  };

  const togglePlayback = () => {
    setPlaybackState((prev) => (prev === "playing" ? "paused" : "playing"));
  };

  const formatAnimationName = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <>
      <NonHomeHeader title="Lottie Animations" showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col overflow-y-auto py-8">
        {/* Animation Selection */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="size-5" />
                Available Animations ({animationEntries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {animationEntries.map(([key]) => (
                  <Button
                    variant="ghost"
                    key={key}
                    onClick={() => setSelectedAnimation(key)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm",
                      selectedAnimation === key &&
                        "border-primary bg-primary/5",
                    )}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {formatAnimationName(key)}
                      </span>
                      {selectedAnimation === key && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Animation Preview */}
        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview: {formatAnimationName(selectedAnimation)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={togglePlayback}
                    variant="outline"
                    size="sm"
                    className="gap-2">
                    {playbackState === "playing" ? (
                      <>
                        <Pause className="size-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-4" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={resetConfig}
                    variant="outline"
                    size="sm"
                    className="gap-2">
                    <RotateCcw className="size-4" />
                    Reset
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex justify-center p-8">
                  <DotLottieReact
                    key={`${selectedAnimation}-${JSON.stringify(config)}-${playbackState}`}
                    src={ASSETS.ANIMATIONS[selectedAnimation]}
                    autoplay={config.autoplay && playbackState === "playing"}
                    loop={config.loop}
                    speed={config.speed}
                    width={config.width}
                    height={config.height}
                    className="rounded-lg border border-border border-dashed"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-medium text-sm">
                    {config.width} × {config.height}px
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Speed: {config.speed}x |
                    {config.autoplay ? " Autoplay" : " Manual"} |
                    {config.loop ? " Loop" : " Once"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Configuration Controls */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                Animation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Playback Options */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Playback Options</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoplay"
                      checked={config.autoplay}
                      onCheckedChange={(checked) =>
                        updateConfig({ autoplay: checked as boolean })
                      }
                    />
                    <Label htmlFor="autoplay" className="text-sm">
                      Autoplay
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loop"
                      checked={config.loop}
                      onCheckedChange={(checked) =>
                        updateConfig({ loop: checked as boolean })
                      }
                    />
                    <Label htmlFor="loop" className="text-sm">
                      Loop
                    </Label>
                  </div>
                </div>
              </div>

              {/* Speed Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-sm">
                    Speed ({config.speed}x)
                  </Label>
                  <Button
                    onClick={() => updateConfig({ speed: 1 })}
                    variant="ghost"
                    size="sm"
                    className="text-xs">
                    Reset to 1x
                  </Button>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={config.speed}
                  onChange={(e) =>
                    updateConfig({ speed: parseFloat(e.target.value) })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
                />
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>0.1x</span>
                  <span>3x</span>
                </div>
              </div>

              {/* Size Controls */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="width" className="font-semibold text-sm">
                    Width ({config.width}px)
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    min="50"
                    max="500"
                    value={config.width}
                    onChange={(e) =>
                      updateConfig({
                        width: Math.max(50, parseInt(e.target.value, 10) || 50),
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="font-semibold text-sm">
                    Height ({config.height}px)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min="50"
                    max="500"
                    value={config.height}
                    onChange={(e) =>
                      updateConfig({
                        height: Math.max(
                          50,
                          parseInt(e.target.value, 10) || 50,
                        ),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Quick Size Presets */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">Size Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Small", width: 100, height: 100 },
                    { label: "Medium", width: 200, height: 200 },
                    { label: "Large", width: 320, height: 320 },
                    { label: "Wide", width: 400, height: 200 },
                    { label: "Tall", width: 200, height: 400 },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      onClick={() =>
                        updateConfig({
                          width: preset.width,
                          height: preset.height,
                        })
                      }
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-xs",
                        config.width === preset.width &&
                          config.height === preset.height &&
                          "border-primary bg-primary/10",
                      )}>
                      {preset.label}
                      <span className="ml-1 text-muted-foreground text-xs">
                        {preset.width}×{preset.height}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Usage Guidelines */}
        <section className="mt-6">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-semibold text-foreground">
              Usage Guidelines:
            </h4>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>• Use consistent sizing across similar contexts</li>
              <li>• Consider performance impact of large animations</li>
              <li>• Test animations on actual devices for smoothness</li>
              <li>• Respect user's motion preferences in production</li>
              <li>• Order Assignment: Used during order matching process</li>
              <li>• Verified/Completed: Success states for orders</li>
              <li>• Cancelled: Used when orders are cancelled</li>
              <li>• Gift Box: Referral and bonus claiming flows</li>
              <li>• Waiting Transfer: Pending payment states</li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
