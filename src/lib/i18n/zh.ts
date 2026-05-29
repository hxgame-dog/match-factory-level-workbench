export const zh = {
  brand: {
    title: "Level-Work",
    subtitle: "关卡设计工作台",
  },
  nav: {
    dashboard: "工作台",
    items: "道具库",
    aiLab: "AI 实验室",
    itemGenerator: "AI 道具表生成器",
    assetStudio: "资源工作室",
    levelGenerator: "关卡生成器",
    levelEditor: "关卡编辑器",
    formulaLab: "公式实验室",
    autoLevelGenerator: "自动续关生成器",
    pipeline: "管线交付",
    playtestSimulator: "试玩模拟器",
    analyticsFeedback: "玩家数据回灌",
  },
  common: {
    provider: "模型提供商",
    apiKey: "API 密钥",
    mockMode: "Mock 模式",
    enterModule: "进入模块",
    usageGuide: "使用指南",
    collapse: "收起",
    expand: "展开",
    comingSoon: "即将推出",
  },
  pages: {
    home: {
      title: "Match Factory 关卡工作台",
      description: "用于生成、管理、诊断 Match 3D 类手游关卡配置",
    },
    items: {
      title: "道具库",
      description: "导入、筛选与管理基础道具目录（支持 CSV / Excel）",
    },
    aiLab: {
      title: "AI 实验室",
      description: "配置 Gemini API、测试文本与图片生成连接",
    },
    itemGenerator: {
      title: "AI 道具表生成器",
      description: "根据描述与类别由 Gemini 自动生成道具表（与道具库独立，不回写库）",
      configTitle: "生成配置",
      configDesc: "填写描述、选择类别与种类数后生成；结果在下方预览，可编辑并保存为道具集",
      previewTitle: "道具列表预览",
      previewEmptyTitle: "尚未生成道具表",
      previewEmptyDesc: "填写配置后点击「生成道具表」，AI 将原创生成道具列表",
      categoryHint: "类别来自道具库的 category1 字段，也可手动添加新类别",
      historyTitle: "历史生成记录",
      fields: {
        setName: { label: "道具集名称", hint: "保存到数据库时使用的名称" },
        description: {
          label: "自定义描述",
          hint: "主题、风格、物种范围等，如「海里河里的鱼、虾、贝类，卡通 3D 风格」",
        },
        categories: { label: "物品类别", hint: "多选 category1，生成结果的 category1 必须属于所选类别" },
        itemCount: { label: "物品种类数", hint: "需要生成多少种不同道具（表格行数），建议 4～40" },
        customCategory: { label: "添加自定义类别" },
      },
      actions: {
        generate: "生成道具表",
        generating: "生成中…",
        save: "保存道具集",
        saving: "保存中…",
        export: "导出 Excel",
        regenerate: "重新生成",
        clear: "清空结果",
        copyJson: "复制 JSON",
      },
      warnings: "生成警告",
      dirty: "已修改未保存",
      roles: {
        target: "目标物",
        distractor: "干扰物",
        filler: "填充",
        special: "特殊",
      },
    },
    assetStudio: {
      title: "资源工作室",
      description: "从道具集生成 Prompt 与图片资源，并导出资源包",
    },
    levelGenerator: {
      title: "关卡生成器",
      description: "基于道具集与资源批次生成标准 LevelConfig 候选关卡",
    },
    levelEditor: {
      title: "关卡编辑器",
      description: "打开、预览、编辑、校验并保存标准 LevelConfig JSON",
    },
    formulaLab: {
      title: "公式实验室",
      description: "难度公式预设、单关诊断与批量回放分析",
    },
    autoLevelGenerator: {
      title: "自动续关生成器",
      description: "基于参考关卡和难度公式，自动续关并筛选候选方案",
    },
    pipeline: {
      title: "管线交付",
      description: "生产包构建、导入导出、快照与外部适配预览",
    },
    playtestSimulator: {
      title: "试玩模拟器",
      description: "本地试玩模拟、QA 评审与平衡建议",
    },
    analyticsFeedback: {
      title: "玩家数据回灌",
      description: "导入玩家数据、诊断真实表现、对比公式与模拟、生成优化建议",
    },
  },
} as const;

export type NavKey = keyof typeof zh.nav;

export const navItems = [
  { href: "/", key: "dashboard" as const, icon: "LayoutDashboard" },
  { href: "/items", key: "items" as const, icon: "PackageSearch" },
  { href: "/ai-lab", key: "aiLab" as const, icon: "FlaskConical" },
  { href: "/item-generator", key: "itemGenerator" as const, icon: "WandSparkles" },
  { href: "/asset-studio", key: "assetStudio" as const, icon: "FolderKanban" },
  { href: "/level-generator", key: "levelGenerator" as const, icon: "Puzzle" },
  { href: "/level-editor", key: "levelEditor" as const, icon: "Puzzle" },
  { href: "/formula-lab", key: "formulaLab" as const, icon: "Sigma" },
  { href: "/auto-level-generator", key: "autoLevelGenerator" as const, icon: "Sparkles" },
  { href: "/pipeline", key: "pipeline" as const, icon: "Workflow" },
  { href: "/playtest-simulator", key: "playtestSimulator" as const, icon: "TestTube2" },
  { href: "/analytics-feedback", key: "analyticsFeedback" as const, icon: "LineChart" },
] as const;

export type NavItemDef = (typeof navItems)[number];
