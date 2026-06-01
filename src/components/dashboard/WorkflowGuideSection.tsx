import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const workflowSteps = [
  {
    step: 1,
    title: "准备数据",
    bullets: [
      "在首页选择或新建工作区（道具集）",
      "在 AI 配置中心配置 Gemini API 并测试连接",
    ],
    links: [
      { href: "/", label: "工作区中心" },
      { href: "/ai-lab", label: "AI 配置中心" },
    ],
  },
  {
    step: 2,
    title: "生成内容",
    bullets: [
      "在 AI 道具表生成器中生成或上传道具表",
      "在资源工作室批量生成 Prompt 与图片",
    ],
    links: [
      { href: "/item-generator", label: "AI 道具表生成器" },
      { href: "/asset-studio", label: "资源工作室" },
    ],
  },
  {
    step: 3,
    title: "关卡设计",
    bullets: ["关卡生成器产出候选配置", "关卡编辑器精调棋盘与道具", "公式实验室诊断难度曲线"],
    links: [
      { href: "/level-generator", label: "关卡生成器" },
      { href: "/level-editor", label: "关卡编辑器" },
      { href: "/formula-lab", label: "公式实验室" },
    ],
  },
  {
    step: 4,
    title: "验证交付",
    bullets: ["试玩模拟器做 QA 与平衡检查", "玩家数据回灌校准公式", "管线模块打包交付生产"],
    links: [
      { href: "/playtest-simulator", label: "试玩模拟器" },
      { href: "/analytics-feedback", label: "数据回灌" },
      { href: "/pipeline", label: "管线交付" },
    ],
  },
  {
    step: 5,
    title: "批量续关（可选）",
    bullets: ["基于参考关卡与目标曲线自动续关", "筛选候选并保存为正式关卡"],
    links: [{ href: "/auto-level-generator", label: "自动续关生成器" }],
  },
] as const;

export function WorkflowGuideSection() {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-foreground">推荐工作流</h2>
        <Link href="/ai-lab" className="text-sm text-primary hover:underline">
          先在 AI 配置中心检查连接 →
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {workflowSteps.map((item) => (
          <Card key={item.step}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted text-sm text-foreground">
                  {item.step}
                </span>
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {item.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-sm border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
                  >
                    {link.label} →
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
