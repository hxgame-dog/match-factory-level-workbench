export type AssetStatus =
  | "pending"
  | "prompt_ready"
  | "generating"
  | "done"
  | "failed"
  | "skipped";

export type GenerateAssetPromptInput = {
  item: {
    name: string;
    displayName?: string;
    category1: string;
    category2?: string;
    color1?: string;
    color2?: string;
    shape?: string;
    size?: string;
    role?: string;
  };
  globalArtStyle: string;
  negativePrompt?: string;
};

export type GenerateAssetPromptResult = {
  prompt: string;
  negativePrompt?: string;
  notes?: string;
};

export type GenerateAssetImageInput = {
  assetId?: string;
  item: {
    generatedItemId?: string;
    sourceItemId?: number;
    catalogItemId?: string;
    name: string;
    displayName?: string;
    category1: string;
    category2?: string;
    color1?: string;
    color2?: string;
    shape?: string;
    size?: string;
    role?: string;
    count?: number;
  };
  prompt: string;
  negativePrompt?: string;
  provider?: "gemini" | "mock";
  imageSize?: "512x512" | "768x768" | "1024x1024";
  backgroundMode?: "transparent" | "plain" | "studio";
};

export type GenerateAssetImageResult = {
  assetId: string;
  status: "done" | "failed";
  imageUrl?: string;
  localPath?: string;
  error?: string;
};
