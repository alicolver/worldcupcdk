export const arrayToObject = <T extends Record<K, any>, K extends keyof any>(
  array: T[] = [],
  getKey: (item: T) => K
) =>
    array.reduce((obj, cur) => {
      const key = getKey(cur)
      return { ...obj, [key]: cur }
    }, {} as Record<K, T>)