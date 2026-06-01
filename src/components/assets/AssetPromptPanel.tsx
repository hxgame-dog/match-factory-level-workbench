"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  onGeneratePrompts: () => void;
  onRegeneratePrompts: () => void;
  onClearPrompts: () => void;
};

export function AssetPromptPanel(props: Props) {
  return (
    <Card >
      <CardHeader>
        <CardTitle className="text-lg">Prompt 生成区</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={props.onGeneratePrompts}>Generate Prompts</Button>
        <Button variant="outline" onClick={props.onRegeneratePrompts}>
          Regenerate All Prompts
        </Button>
        <Button variant="outline" onClick={props.onClearPrompts}>
          Clear Prompts
        </Button>
      </CardContent>
    </Card>
  );
}
