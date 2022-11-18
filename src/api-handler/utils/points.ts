type Result = {
  homeScore: number;
  awayScore: number;
};

export const calculatePoints = (prediction: Result, result: Result): number => {
  let points = 0

  // correct result 2 points
  if (
    (prediction.homeScore < prediction.awayScore &&
      result.homeScore < result.awayScore) ||
    (prediction.homeScore > prediction.awayScore &&
      result.homeScore > result.awayScore) ||
    (prediction.homeScore === prediction.awayScore &&
      result.homeScore === result.awayScore)
  ) {
    points += 2
  }

  // correct score 1 bonus point
  if (
    prediction.awayScore === result.awayScore &&
    prediction.homeScore === result.homeScore
  ) {
    points += 1
  }

  return points
}
