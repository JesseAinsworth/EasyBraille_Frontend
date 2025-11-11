import { connectDB } from "./mongodb" 
import mongoose, { Schema, model, models } from "mongoose"

const validActions = ["keyPress", "delete", "submit", "other"] as const
type ActionType = typeof validActions[number]

interface KeyboardAction {
  userId: string
  brailleCode: string
  character: string
  actionType: ActionType
  timestamp: Date
  deviceId?: string
}

const KeyboardActionSchema = new Schema<KeyboardAction>({
  userId: { type: String, required: true },
  brailleCode: { type: String, required: true },
  character: { type: String, required: true },
  actionType: { type: String, enum: validActions, required: true },
  timestamp: { type: Date, required: true },
  deviceId: { type: String, required: false },
})

const KeyboardActionModel = models.KeyboardAction || model("KeyboardAction", KeyboardActionSchema)

export async function logKeyboardAction(data: KeyboardAction) {
  await connectDB()
  const action = await KeyboardActionModel.create(data)
  return action
}

export async function getRecentKeyboardActions(limit: number) {
  await connectDB()
  return await KeyboardActionModel.find().sort({ timestamp: -1 }).limit(limit).lean()
}
