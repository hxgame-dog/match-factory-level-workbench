"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  prompt: string;
  negativePrompt: string;
  onChange: (next: { prompt: string; negativePrompt: string }) => void;
  onSave: () => void;
  onClose: () => void;
};

export function AssetPromptDialog(props: Props) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-md border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">编辑 Prompt</h3>
        <Textarea value={props.prompt} onChange={(e) => props.onChange({ prompt: e.target.value, negativePrompt: props.negativePrompt })} className="mb-2 min-h-28" />
        <Input value={props.negativePrompt} onChange={(e) => props.onChange({ prompt: props.prompt, negativePrompt: e.target.value })} />
        <div className="mt-3 flex gap-2">
          <Button onClick={props.onSave}>保存</Button>
          <Button variant="outline" onClick={props.onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
