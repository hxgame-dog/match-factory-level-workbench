"use client";

import { Button } from "@/components/ui/button";

type Props = {
  onPreview: () => void;
  onCopy: () => void;
  onSave: () => void;
  onSaveAsCopy: () => void;
  onExport: () => void;
  onReset: () => void;
};

export function LevelJsonActions(props: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={props.onPreview}>Preview JSON</Button>
      <Button variant="outline" onClick={props.onCopy}>Copy JSON</Button>
      <Button onClick={props.onSave}>Save</Button>
      <Button variant="outline" onClick={props.onSaveAsCopy}>Save As Copy</Button>
      <Button variant="outline" onClick={props.onExport}>Export JSON</Button>
      <Button variant="outline" onClick={props.onReset}>Reset Changes</Button>
    </div>
  );
}
