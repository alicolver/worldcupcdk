import { z } from "zod"

export const leagueTableSchema = z.object({
  leagueId: z.string(),
  userIds: z.array(z.string()),
  name: z.string()
})

export const userTableSchema = z.object({
  userId: z.string(),
  leagueIds: z.array(z.string())
})

export const pointsTableSchema = z.object({
  userId: z.string(),
  pointsHistory: z.array(z.number()),
  totalPoints: z.number()
})

export const predictionsTableSchema = z.object({
  userId: z.string(),
  matchId: z.string(),
  home: z.number(),
  away: z.number()
})

export const matchesTableSchema = z.object({
  matchId: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  result: z.optional(z.object({ home: z.number(), away: z.number() })),
  matchDay: z.number(),
  date: z.string(),
  time: z.string(),
  isFinished: z.boolean(),
})