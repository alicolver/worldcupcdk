const padTo2Digits = (num: number): string => {
  return num.toString().padStart(2, "0")
}

export const getFormattedDate = (date: Date): string => {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-"))
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const numberOfPreviousMatchDays: Record<string, number> = {
  "2022-11-20": 1,
  "2022-11-21": 2,
  "2022-11-22": 3,
  "2022-11-23": 4,
  "2022-11-24": 5,
  "2022-11-25": 6,
  "2022-11-26": 7,
  "2022-11-27": 8,
  "2022-11-28": 9,
  "2022-11-29": 10,
  "2022-11-30": 11,
  "2022-12-01": 12,
  "2022-12-02": 13,
  "2022-12-03": 14,
  "2022-12-04": 15,
  "2022-12-05": 16,
  "2022-12-06": 17,
  "2022-12-07": 17,
  "2022-12-08": 17,
  "2022-12-09": 18,
  "2022-12-10": 19,
  "2022-12-11": 19,
  "2022-12-12": 19,
  "2022-12-13": 20,
  "2022-12-14": 21,
  "2022-12-15": 21,
  "2022-12-16": 21,
  "2022-12-17": 22,
  "2022-12-18": 23,
}