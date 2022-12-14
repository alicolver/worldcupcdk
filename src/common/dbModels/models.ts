import { z } from "zod"

export const leagueTableSchema = z.object({
  leagueId: z.string(),
  leagueName: z.string(),
  userIds: z.array(z.string())
})

export const userTableSchema = z.object({
  userId: z.string(),
  givenName: z.string(),
  familyName: z.string(),
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
  homeScore: z.number().nullish(),
  awayScore: z.number().nullish(),
  toGoThrough: z.enum(["HOME", "AWAY"]).nullish(),
  points: z.number().nullish()
})

export const matchesTableSchema = z.object({
  matchId: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  gameStage: z.enum(["GROUP", "FINAL", "SEMIFINAL", "QUARTERFINAL", "OCTOFINAL"]),
  result: z.optional(z.object({ home: z.number(), away: z.number() })),
  toGoThrough: z.enum(["HOME", "AWAY"]).nullish(),
  matchDay: z.number(),
  matchDate: z.string(),
  matchTime: z.string(),
  isFinished: z.boolean(),
})

export type MatchesTableItem = z.infer<typeof matchesTableSchema>
export type PredictionsTableItem = z.infer<typeof predictionsTableSchema>
export type PointsTableItem = z.infer<typeof pointsTableSchema>
export type UserTableItem = z.infer<typeof userTableSchema>
export type LeagueTableItem = z.infer<typeof leagueTableSchema>
