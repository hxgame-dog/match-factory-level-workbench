export type GuideSection = {
  heading: string;
  bullets: string[];
};

export type PageGuide = {
  title: string;
  sections: GuideSection[];
};

export const pageGuides: Record<string, PageGuide> = {
  "/": {
    title: "工作台概览",
    sections: [
      {
        heading: "快速开始",
        bullets: [
          "先查看上方「推荐工作流」按步骤操作",
          "在 AI 配置中心确认 Gemini 连接与出图能力",
          "通过各功能模块卡片进入对应工具",
        ],
      },
    ],
  },
  "/items": {
    title: "道具库上传",
    sections: [
      {
        heading: "提示",
        bullets: ["本页已合并至 AI 道具表生成器 →「上传道具表」标签"],
      },
    ],
  },
  "/ai-lab": {
    title: "AI 配置中心",
    sections: [
      {
        heading: "配置 Gemini",
        bullets: [
          "保存 API Key（仅存服务端 HttpOnly Cookie）",
          "选择文本模型与图片模型",
          "使用「测试连接」与「测试出图」验证",
        ],
      },
      {
        heading: "注意事项",
        bullets: ["生产环境也可在 Vercel 配置 GEMINI_API_KEY", "关闭 Mock 模式后才会调用真实 API"],
      },
    ],
  },
  "/item-generator": {
    title: "AI 道具表生成器",
    sections: [
      {
        heading: "生成道具表",
        bullets: [
          "填写描述、物品种类数、颜色数量（种类×颜色=总条数）",
          "标准 8 色：红橙黄绿蓝紫粉灰",
          "右侧为主预览区，可保存为道具集",
        ],
      },
      {
        heading: "上传道具表",
        bullets: [
          "切换到「上传道具表」标签导入 CSV/Excel",
          "支持一键清空整个道具库",
          "上传数据与 AI 生成相互独立",
        ],
      },
    ],
  },
  "/asset-studio": {
    title: "资源工作室",
    sections: [
      {
        heading: "出图流程",
        bullets: [
          "选择已保存的道具集",
          "批量生成 Prompt 后逐张或批量出图",
          "失败卡片可查看错误信息并重试",
        ],
      },
      {
        heading: "注意事项",
        bullets: ["需配置 Gemini 图片模型（如 gemini-2.5-flash-image）", "批量完成后会自动刷新批次结果"],
      },
    ],
  },
  "/level-generator": {
    title: "关卡生成器",
    sections: [
      {
        heading: "使用步骤",
        bullets: ["选择道具集与资源批次", "配置关卡基础参数与规则预设", "生成候选关卡并保存或导出 JSON"],
      },
    ],
  },
  "/level-editor": {
    title: "关卡编辑器",
    sections: [
      {
        heading: "编辑流程",
        bullets: ["从列表选择关卡进入编辑", "在棋盘预览中调整道具", "保存前运行校验查看问题"],
      },
    ],
  },
  "/formula-lab": {
    title: "公式实验室",
    sections: [
      {
        heading: "诊断功能",
        bullets: ["管理难度公式预设权重", "单关诊断查看分项得分", "批量回放对比关卡曲线"],
      },
    ],
  },
  "/auto-level-generator": {
    title: "自动续关生成器",
    sections: [
      {
        heading: "适用场景",
        bullets: ["基于参考关卡批量续关", "按目标难度曲线筛选候选", "保存最优方案到关卡库"],
      },
    ],
  },
  "/pipeline": {
    title: "管线交付",
    sections: [
      {
        heading: "交付流程",
        bullets: ["构建生产包并校验清单", "导入/导出关卡与公式预设", "使用快照对比与回滚版本"],
      },
    ],
  },
  "/playtest-simulator": {
    title: "试玩模拟器",
    sections: [
      {
        heading: "模拟说明",
        bullets: ["配置玩家画像与模拟参数", "单关或批量运行试玩", "查看通过率与 QA 问题列表"],
      },
    ],
  },
  "/analytics-feedback": {
    title: "玩家数据回灌",
    sections: [
      {
        heading: "数据流程",
        bullets: ["导入玩家行为数据（CSV/Excel）", "诊断关卡表现并生成优化建议", "与公式实验室校准对比"],
      },
    ],
  },
};

export function getPageGuide(pathname: string): PageGuide | null {
  return pageGuides[pathname] ?? null;
}
