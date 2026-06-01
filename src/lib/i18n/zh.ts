export const zh = {
  brand: {
    title: "Level-Work",
    subtitle: "关卡设计工作台",
  },
  nav: {
    dashboard: "工作台",
    aiLab: "AI 配置中心",
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
  theme: {
    light: "浅色模式",
    dark: "深色模式",
    system: "跟随系统",
    switchToLight: "切换为浅色模式",
    switchToDark: "切换为深色模式",
    cycle: "切换主题（浅色 / 深色 / 跟随系统）",
  },
  pages: {
    home: {
      title: "Match Factory 关卡工作台",
      description: "用于生成、管理、诊断 Match 3D 类手游关卡配置",
    },
    items: {
      title: "道具库上传",
      description: "上传 CSV / Excel 管理基础道具目录，支持筛选、导出与删除",
    },
    aiLab: {
      title: "AI 配置中心",
      description: "配置 Gemini API、测试文本与图片生成连接",
    },
    itemGenerator: {
      title: "AI 道具表生成器",
      description: "支持 AI 生成道具表或上传 Excel/CSV；生成与上传数据相互独立",
      tabs: {
        generate: "生成道具表",
        upload: "上传道具表",
      },
      configTitle: "生成配置",
      configDesc: "填写描述与数量；右侧为主要预览区",
      previewTitle: "道具表预览",
      previewEmptyTitle: "尚未生成道具表",
      previewEmptyDesc: "填写左侧配置后点击「生成道具表」",
      historyTitle: "历史生成记录",
      upload: {
        catalogTitle: "已上传道具库",
        catalogDesc: "上传的 Excel/CSV 保存在道具库，可一键清空",
        clearAll: "清空道具库",
      },
      fields: {
        setName: { label: "道具集名称", hint: "保存 AI 生成结果时使用的名称" },
        description: {
          label: "自定义描述",
          hint: "主题、风格、物种范围等；category1 由 AI 自动分配",
        },
        itemTypeCount: {
          label: "物品种类数",
          hint: "有多少种不同造型（如 100 种鱼）",
        },
        colorCount: {
          label: "颜色数量",
          hint: "每种造型展开几种颜色（标准色板前 N 色：红橙黄绿蓝紫粉灰）",
        },
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
      moveSpeedLabels: {
        1: "很慢",
        2: "慢",
        3: "中",
        4: "快",
        5: "很快",
      } as Record<1 | 2 | 3 | 4 | 5, string>,
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
