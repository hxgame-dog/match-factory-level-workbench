export const analyticsFieldAliases: Record<string, string[]> = {
  levelIndex: ["level", "level_index", "levelindex", "level_id_num", "关卡", "关卡号"],
  levelId: ["level_id", "levelid", "id", "关卡id"],
  levelName: ["level_name", "levelname", "name", "关卡名称"],
  users: ["users", "uv", "players", "player_count", "用户数"],
  starts: ["starts", "start_count", "attempts", "plays", "开始次数", "尝试次数"],
  completes: ["completes", "complete_count", "wins", "pass", "通关次数", "完成次数"],
  fails: ["fails", "fail_count", "losses", "失败次数"],
  quits: ["quits", "quit_count", "dropouts", "退出次数"],
  retries: ["retries", "retry_count", "重试次数"],
  passRate: ["pass_rate", "win_rate", "completion_rate", "通关率"],
  failRate: ["fail_rate", "失败率"],
  quitRate: ["quit_rate", "退出率"],
  retryRate: ["retry_rate", "重试率"],
  avgDurationSec: ["avg_duration", "avg_time", "duration_sec", "平均时长"],
  avgRemainingTimeSec: ["avg_remaining_time", "remaining_time", "平均剩余时间"],
  avgMoves: ["avg_moves", "moves", "平均步数"],
  avgBoostersUsed: ["avg_boosters", "booster_used", "平均道具使用"],
  avgHintsUsed: ["avg_hints", "hint_used", "平均提示使用"],
  avgShuffleUsed: ["avg_shuffle", "shuffle_used", "平均洗牌使用"],
  revenue: ["revenue", "收入"],
  adImpressions: ["ad_impressions", "ads", "广告展示"],
  iapPurchases: ["iap_purchases", "purchases", "内购次数"],
};

const numericFields = new Set([
  "levelIndex",
  "users",
  "starts",
  "completes",
  "fails",
  "quits",
  "retries",
  "passRate",
  "failRate",
  "quitRate",
  "retryRate",
  "avgDurationSec",
  "avgRemainingTimeSec",
  "avgMoves",
  "avgBoostersUsed",
  "avgHintsUsed",
  "avgShuffleUsed",
  "revenue",
  "adImpressions",
  "iapPurchases",
]);

export function isNumericAnalyticsField(field: string): boolean {
  return numericFields.has(field);
}

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}
