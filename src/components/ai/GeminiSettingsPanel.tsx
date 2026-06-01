"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SettingsData = {
  hasGeminiKey: boolean;
  keySource?: string;
  keyHint?: string;
  textModel: string;
  imageModel: string;
};

type ListedModel = {
  name: string;
  displayName?: string;
  imageCapable: boolean;
  textCapable: boolean;
};

export function GeminiSettingsPanel({ compact }: { compact?: boolean }) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [textModel, setTextModel] = useState("gemini-2.5-flash");
  const [imageModel, setImageModel] = useState("gemini-2.5-flash-image");
  const [imageModels, setImageModels] = useState<ListedModel[]>([]);
  const [textModels, setTextModels] = useState<ListedModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState<string | null>(null);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/ai/settings").then((r) => r.json());
    if (res.success) {
      setSettings(res.data);
      setTextModel(res.data.textModel);
      setImageModel(res.data.imageModel);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveKey() {
    if (!apiKeyInput.trim()) {
      setError("请输入 API Key");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "保存失败");
        return;
      }
      setApiKeyInput("");
      setSettings(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function clearKey() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearKey: true }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "清除失败");
        return;
      }
      setSettings(res.data);
      setImageModels([]);
      setTextModels([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveModels() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textModel, imageModel }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "保存模型失败");
        return;
      }
      setSettings(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchModels() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          apiKeyInput.trim() ? { apiKey: apiKeyInput.trim() } : {},
        ),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "获取模型失败");
        return;
      }
      setImageModels(res.data.imageModels);
      setTextModels(res.data.textModels);
      if (res.data.imageModels[0] && !imageModels.length) {
        setImageModel((prev) => prev || res.data.imageModels[0].name);
      }
      if (res.data.textModels[0]) {
        setTextModel((prev) => prev || res.data.textModels[0].name);
      }
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    setLoading(true);
    setError(null);
    setTestText(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Hello",
          textModel,
          ...(apiKeyInput.trim() ? { apiKey: apiKeyInput.trim() } : {}),
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "连接测试失败");
        return;
      }
      setTestText(res.result);
    } finally {
      setLoading(false);
    }
  }

  async function testImage() {
    setLoading(true);
    setError(null);
    setTestImageUrl(null);
    try {
      const res = await fetch("/api/ai/test-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageModel,
          ...(apiKeyInput.trim() ? { apiKey: apiKeyInput.trim() } : {}),
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "图像测试失败");
        return;
      }
      setTestImageUrl(res.data.imageUrl);
    } finally {
      setLoading(false);
    }
  }

  const inner = (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {settings?.hasGeminiKey ? (
            <Badge variant="outline">已配置 Key（{settings.keyHint}）</Badge>
          ) : (
            <Badge variant="secondary">未配置 Key</Badge>
          )}
          {settings?.keySource ? (
            <Badge variant="outline">
              来源：{settings.keySource === "session" ? "浏览器会话" : settings.keySource === "env" ? "服务器环境变量" : "无"}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Gemini API Key（保存后清空输入框）</label>
          <Input
            type="password"
            autoComplete="off"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={settings?.hasGeminiKey ? "输入新 Key 可覆盖已保存的 Key" : "粘贴 Google AI Studio API Key"}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void saveKey()} disabled={loading}>
              保存 Key 到服务端
            </Button>
            <Button size="sm" variant="outline" onClick={() => void clearKey()} disabled={loading}>
              清除会话 Key
            </Button>
            <Button size="sm" variant="outline" onClick={() => void fetchModels()} disabled={loading}>
              检测可用模型
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">文本模型</label>
            {textModels.length > 0 ? (
              <Select value={textModel} onValueChange={(v) => setTextModel(v ?? textModel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {textModels.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.displayName ?? m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={textModel} onChange={(e) => setTextModel(e.target.value)} />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">图像模型</label>
            {imageModels.length > 0 ? (
              <Select value={imageModel} onValueChange={(v) => setImageModel(v ?? imageModel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {imageModels.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.displayName ?? m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={imageModel} onChange={(e) => setImageModel(e.target.value)} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void saveModels()} disabled={loading}>
            保存模型选择
          </Button>
          <Button size="sm" variant="outline" onClick={() => void testConnection()} disabled={loading}>
            测试文本连接
          </Button>
          <Button size="sm" variant="outline" onClick={() => void testImage()} disabled={loading}>
            测试图像生成
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {testText ? (
          <Alert>
            <AlertTitle>文本测试成功</AlertTitle>
            <AlertDescription className="text-sm">{testText}</AlertDescription>
          </Alert>
        ) : null}

        {testImageUrl ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">图像测试成功</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={testImageUrl} alt="Gemini 测试图" className="h-40 w-40 rounded border border-border object-contain" />
          </div>
        ) : null}
      </div>
  );

  if (compact) {
    return inner;
  }

  return (
    <Card>
      <CardHeader className="border-b border-border bg-muted/30">
        <CardTitle className="text-lg">Gemini 连接与图像模型</CardTitle>
        <p className="text-xs text-muted-foreground">
          API Key 仅通过服务端 HttpOnly Cookie 保存，不会写入前端 localStorage，接口响应中也不会返回完整 Key。
        </p>
      </CardHeader>
      <CardContent className="p-0">{inner}</CardContent>
    </Card>
  );
}
