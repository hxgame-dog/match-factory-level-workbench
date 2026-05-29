"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type TestResult = {
  provider: string;
  model: string;
  mockMode: boolean;
  result: string;
};

export function AiTestPanel() {
  const [prompt, setPrompt] = useState("请返回一段用于测试连接的简短文本。");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  async function onTest() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "AI 测试失败");
      }
      setResult(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 测试失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border bg-muted/30">
        <CardTitle className="text-lg">Gemini 文本连接测试</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-28" />
        <Button onClick={onTest} disabled={loading}>
          {loading ? "测试中..." : "测试文本连接"}
        </Button>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>请求失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {result ? (
          <Alert>
            <AlertTitle>
              返回成功（Provider: {result.provider} / Model: {result.model}）
            </AlertTitle>
            <AlertDescription className="space-y-2">
              {result.mockMode ? <p className="text-amber-600">当前为 Mock 返回模式</p> : null}
              <p>{result.result}</p>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
