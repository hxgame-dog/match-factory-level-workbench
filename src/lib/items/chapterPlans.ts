/**
 * 动物主题四章节道具规划方案（标准版，690 个独立道具）。
 * 每章「单独生成」，种类数按本章新增（不含跨章复用），颜色数为 0（各物种用常规主色）。
 * 类别配额仅包含本章全新道具，复用部分不在生成范围内。
 */

export type ChapterPlanCategory = {
  /** 类别名称 */
  name: string;
  /** 该类别目标种类数 */
  count: number;
};

export type ChapterPlan = {
  id: string;
  icon: string;
  /** 章节名，如「海里游的」 */
  name: string;
  /** 副标题，如「蔚蓝海洋大冒险」 */
  subtitle: string;
  /** 生成时使用的设定名 */
  setName: string;
  /** 主题名词短语，用于描述开头 */
  theme: string;
  /** 本章新增种类数（= 生成的 itemTypeCount） */
  addedCount: number;
  /** 章节可用池（含复用），仅用于展示 */
  poolCount: number;
  /** 复用旧道具数量，仅用于展示 */
  reusedCount: number;
  /** 颜色数（0 = 不展开颜色变体） */
  colorCount: number;
  /** 五个主题阶段 */
  stages: string[];
  /** 本章全新道具的类别配额（合计 = addedCount） */
  categories: ChapterPlanCategory[];
  /** 差异化与去重要求 */
  risk: string;
  /** 生成范围说明（首章 / 复用提示） */
  note: string;
};

export const ANIMAL_CHAPTER_PLANS: ChapterPlan[] = [
  {
    id: "sea",
    icon: "🐠",
    name: "海里游的",
    subtitle: "蔚蓝海洋大冒险",
    setName: "动物主题·第一章·海里游的",
    theme: "海洋动物与海洋主题道具",
    addedCount: 200,
    poolCount: 200,
    reusedCount: 0,
    colorCount: 0,
    stages: ["浅海沙滩", "珊瑚礁", "蓝色远洋", "神秘海底", "冰海与海岛"],
    categories: [
      { name: "常见海洋鱼类", count: 55 },
      { name: "热带与观赏鱼类", count: 25 },
      { name: "虾蟹龙虾等甲壳类", count: 20 },
      { name: "章鱼鱿鱼与贝类", count: 18 },
      { name: "海洋哺乳动物", count: 12 },
      { name: "海龟与水生两栖类", count: 8 },
      { name: "水母海星海胆等", count: 12 },
      { name: "珊瑚水草贝壳等环境物", count: 20 },
      { name: "航海捕鱼潜水物品", count: 15 },
      { name: "宝藏与漂流物品", count: 10 },
      { name: "气泡鱼卵等小型物", count: 5 },
    ],
    risk: "鱼类轮廓必须充分差异化，避免大量同轮廓鱼共存；环境物与道具用于丰富搭配",
    note: "本章为首章，全部为全新道具，不复用旧内容",
  },
  {
    id: "land",
    icon: "🦁",
    name: "地上跑的",
    subtitle: "奇趣陆地动物园",
    setName: "动物主题·第二章·地上跑的",
    theme: "陆地动物与场景道具",
    addedCount: 210,
    poolCount: 240,
    reusedCount: 30,
    colorCount: 0,
    stages: ["快乐农场", "森林伙伴", "草原王国", "沙漠与高原", "冰雪大陆"],
    categories: [
      { name: "家养动物", count: 35 },
      { name: "森林动物", count: 35 },
      { name: "草原动物", count: 30 },
      { name: "沙漠与高原动物", count: 20 },
      { name: "寒带动物", count: 15 },
      { name: "爬行动物", count: 15 },
      { name: "两栖动物", count: 8 },
      { name: "小型动物与幼崽变体", count: 32 },
      { name: "自然环境物", count: 10 },
      { name: "饲养与场景物品", count: 10 },
    ],
    risk: "犬科、猫科、鹿科、马科等相似动物的主色与姿态需明显不同，避免轮廓趋同",
    note: "只生成本章全新道具（复用的海岸与湿地道具不在此次生成范围）",
  },
  {
    id: "sky",
    icon: "🦜",
    name: "天上飞的",
    subtitle: "天空飞行嘉年华",
    setName: "动物主题·第三章·天上飞的",
    theme: "飞行动物与天空主题道具",
    addedCount: 180,
    poolCount: 220,
    reusedCount: 40,
    colorCount: 0,
    stages: ["花园小飞虫", "森林树冠", "湖泊与湿地", "高山与悬崖", "夜空与云端"],
    categories: [
      { name: "常见小型鸟", count: 30 },
      { name: "水鸟", count: 18 },
      { name: "猛禽与夜行鸟", count: 14 },
      { name: "高辨识鸟类", count: 20 },
      { name: "特色鸟类", count: 13 },
      { name: "飞行昆虫", count: 25 },
      { name: "蝙蝠等特殊飞行动物", count: 5 },
      { name: "幼鸟与姿态变体", count: 25 },
      { name: "鸟巢鸟蛋羽毛", count: 12 },
      { name: "云朵气球风筝等", count: 10 },
      { name: "花朵与果实等环境物", count: 8 },
    ],
    risk: "鸟类占比不要过高，务必用飞虫、鸟巢、云朵和飞行物品补足，避免出现“大量仅颜色不同的小鸟”",
    note: "只生成本章全新道具（复用的旧章节道具不在此次生成范围）",
  },
  {
    id: "mix",
    icon: "🌍",
    name: "综合动物世界",
    subtitle: "动物星球大集合",
    setName: "动物主题·第四章·综合动物世界",
    theme: "综合动物主题新道具",
    addedCount: 100,
    poolCount: 380,
    reusedCount: 280,
    colorCount: 0,
    stages: ["动物大迁徙", "世界动物园", "动物家庭日", "自然救援行动", "动物嘉年华"],
    categories: [
      { name: "动物家庭与幼崽", count: 25 },
      { name: "动物互动姿态", count: 20 },
      { name: "跨生态代表动物", count: 15 },
      { name: "携带食物或玩具版本", count: 15 },
      { name: "旅行与探索物品", count: 10 },
      { name: "嘉年华物品", count: 10 },
      { name: "通用环境物", count: 5 },
    ],
    risk: "突出“家庭、互动、嘉年华”的差异化新内容，与前三章已有的单体动物形成互补，不要重复造已有的普通动物",
    note: "本章主要复用前三章道具，此次只生成本章的全新道具",
  },
];

/** 根据章节方案生成喂给 AI 的结构化描述（含类别配额、阶段、差异化要求） */
export function buildChapterDescription(plan: ChapterPlan): string {
  const categoryText = plan.categories
    .map((c) => `${c.name}约${c.count}种`)
    .join("、");
  return `卡通 3D 风格的${plan.theme}，用于消除类休闲游戏，主题“${plan.subtitle}”，覆盖${plan.stages.join(" / ")}五个阶段。${plan.note}。请生成尽量互不相同、轮廓辨识度高的物品，按以下类别与目标数量分布：${categoryText}。要求：${plan.risk}。`;
}
