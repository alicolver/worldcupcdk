import { number, string } from "zod"

export const convertArrayToObject = (array: Record<string, any>[], key: string) => {
  const initialValue = {}
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item,
    }
  }, initialValue)
}