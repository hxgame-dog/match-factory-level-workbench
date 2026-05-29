export const generatorRulePresets = [
  { id: "fixed_distribution", name: "固定投放", difficultyValue: 0.8, description: "所有道具在开局时固定投放，适合早期关卡。" },
  { id: "balanced_random", name: "均衡随机", difficultyValue: 1.0, description: "目标物和干扰物按比例随机投放，难度中等。" },
  { id: "target_sparse", name: "目标稀疏", difficultyValue: 1.25, description: "目标物出现更分散，玩家需要更多搜索。" },
  { id: "similarity_pressure", name: "相似物压迫", difficultyValue: 1.45, description: "增加相似颜色或形状干扰物，提升识别压力。" },
  { id: "late_target_reveal", name: "目标后置", difficultyValue: 1.65, description: "部分目标物在后续刷新中才出现，适合高难关。" },
];

export const refreshRulePresets = [
  { id: "no_refresh", name: "不刷新", difficultyValue: 0.8, description: "开局投放所有物品，不额外刷新。" },
  { id: "clear_then_refresh", name: "清理后刷新", difficultyValue: 1.0, description: "清理一定数量后刷新新物品。" },
  { id: "time_interval_refresh", name: "定时刷新", difficultyValue: 1.2, description: "每隔一段时间刷新一批物品。" },
  { id: "target_gap_refresh", name: "目标缺口刷新", difficultyValue: 1.35, description: "当目标不足时刷新目标或相关干扰物。" },
  { id: "random_pressure_refresh", name: "随机压力刷新", difficultyValue: 1.5, description: "随机刷新干扰物，制造视觉压力。" },
];
