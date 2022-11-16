type RankObject = {
  totalPoints: number;
  userId: string;
  rank?: number;
};

export const rank = (
  array: RankObject[],
  compare: (a: RankObject, b: RankObject) => number,
  consecutiveRanks: boolean
) => {
  const sorted = array.slice().sort(compare)
  let current
  for (const [i, obj] of sorted.entries()) {
    if (!current || compare(current, obj) != 0) {
      obj["rank"] = !consecutiveRanks
        ? i + 1
        : !current
          ? 1
          : (current["rank"] || 0) + 1
      current = obj
    } else {
      obj["rank"] = current["rank"]
    }
  }
  return sorted
}
