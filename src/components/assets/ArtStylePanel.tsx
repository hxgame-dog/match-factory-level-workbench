"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const presets = {
  "Casual 3D Cartoon":
    "stylized 3D cartoon mobile puzzle game item asset, soft material, clean silhouette, centered, consistent lighting",
  "Soft Toy Style":
    "soft toy-like 3D object, rounded corners, pastel tones, centered, clean studio background, mobile game collectible style",
  "Clean Mobile Game Icon":
    "clean 3D mobile game icon object, single item, centered, transparent background, high readability, no text",
  "Semi-realistic 3D Prop":
    "semi-realistic 3D prop for mobile puzzle game, single isolated object, centered composition, no clutter",
  "Clay Render Style":
    "clay render 3D object, matte material, single centered item, simple background, stylized game asset",
};

type Props = {
  globalArtStyle: string;
  negativePrompt: string;
  imageSize: "512x512" | "768x768" | "1024x1024";
  backgroundMode: "transparent" | "plain" | "studio";
  outputFormat: "svg" | "png";
  onChange: (next: Partial<Props>) => void;
};

export function ArtStylePanel(props: Props) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">全局美术风格区</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(presets).map(([name, prompt]) => (
            <Button key={name} variant="outline" size="sm" onClick={() => props.onChange({ globalArtStyle: prompt })}>
              {name}
            </Button>
          ))}
        </div>
        <Textarea value={props.globalArtStyle} onChange={(e) => props.onChange({ globalArtStyle: e.target.value })} />
        <Textarea value={props.negativePrompt} onChange={(e) => props.onChange({ negativePrompt: e.target.value })} />
        <div className="grid gap-2 md:grid-cols-3">
          <Select value={props.imageSize} onValueChange={(v) => props.onChange({ imageSize: (v ?? "512x512") as Props["imageSize"] })}>
            <SelectTrigger><SelectValue placeholder="Image Size" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="512x512">512x512</SelectItem>
              <SelectItem value="768x768">768x768</SelectItem>
              <SelectItem value="1024x1024">1024x1024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={props.backgroundMode} onValueChange={(v) => props.onChange({ backgroundMode: (v ?? "plain") as Props["backgroundMode"] })}>
            <SelectTrigger><SelectValue placeholder="Background" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">transparent</SelectItem>
              <SelectItem value="plain">plain</SelectItem>
              <SelectItem value="studio">studio</SelectItem>
            </SelectContent>
          </Select>
          <Input value={props.outputFormat} onChange={(e) => props.onChange({ outputFormat: (e.target.value || "svg") as Props["outputFormat"] })} />
        </div>
      </CardContent>
    </Card>
  );
}
