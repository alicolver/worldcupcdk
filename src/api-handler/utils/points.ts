import { getFormattedDate, isMatchDay, numberOfPreviousMatchDays } from "./date"

type Result = {
  homeScore: number;
  awayScore: number;
};

type Prediction = {
  homeScore?: number | null;
  awayScore?: number | null;
}

export const calculatePoints = (result: Result, prediction?: Prediction ): number => {
  if (!prediction) {
    return 0
  }
  
  if (!prediction.homeScore && prediction.homeScore !== 0) {
    return 0
  }

  if (!prediction.awayScore && prediction.awayScore !== 0) {
    return 0
  }

  // correct score 5 points
  if (
    prediction.awayScore === result.awayScore &&
    prediction.homeScore === result.homeScore
  ) {
    return 5
  }

  // correct result 2 points
  if (prediction.homeScore < prediction.awayScore &&
      result.homeScore < result.awayScore) {
    return 2
  }
  if (prediction.homeScore > prediction.awayScore &&
      result.homeScore > result.awayScore) {
    return 2
  }
  if (prediction.homeScore === prediction.awayScore &&
      result.homeScore === result.awayScore) {
    return 2
  }
  

  return 0
}

export const calculateTodaysPoints = (pointsHistory: number[], livePoints: number) => {
  const formattedDate = getFormattedDate(new Date())
  if (!isMatchDay[formattedDate]) return 0
  const previousMatchDays = numberOfPreviousMatchDays[formattedDate]
  if (!previousMatchDays) return 0 
  if (pointsHistory.length < previousMatchDays) return livePoints
  return pointsHistory.slice(-1)[0] + livePoints
}
