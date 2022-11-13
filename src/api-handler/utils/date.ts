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