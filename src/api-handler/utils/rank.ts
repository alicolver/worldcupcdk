type RankObject = {
  totalPoints: number;
  previousTotalPoints?: number;
  userId: string;
  rank?: number;
  yesterdayRank?: number
};

export const rank = (
  array: RankObject[],
  compare: (a: RankObject, b: RankObject) => number,
  consecutiveRanks: boolean,
  key: "rank" | "yesterdayRank" = "rank"
) => {
  const sorted = array.slice().sort(compare)
  let current
  for (const [i, obj] of sorted.entries()) {
    if (!current || compare(current, obj) != 0) {
      obj[key] = !consecutiveRanks
        ? i + 1
        : !current
          ? 1
          : (current[key] || 0) + 1
      current = obj
    } else {
      obj[key] = current[key]
    }
  }
  return sorted
}
