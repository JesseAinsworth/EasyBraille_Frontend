import { ObjectId } from "mongodb"
import { getTranslationsCollection } from "@/lib/mongodb"
import { type Translation, type CreateTranslationData, validateTranslationData } from "@/models/Translation"

export async function createTranslation(translationData: CreateTranslationData): Promise<Translation> {
  // Validar datos
  const validation = validateTranslationData(translationData)
  if (!validation.isValid) {
    throw new Error(`Datos inválidos: ${validation.errors.join(", ")}`)
  }

  const translationsCollection = await getTranslationsCollection()

  const newTranslation: Omit<Translation, "_id"> = {
    userId: new ObjectId(translationData.userId),
    originalText: translationData.originalText.trim(),
    brailleText: translationData.brailleText.trim(),
    translationType: translationData.translationType,
    language: translationData.language || "es",
    imageUrl: translationData.imageUrl,
    createdAt: new Date(),
  }

  const result = await translationsCollection.insertOne(newTranslation)

  return {
    ...newTranslation,
    _id: result.insertedId,
  }
}

export async function getTranslationsByUserId(userId: string): Promise<Translation[]> {
  const translationsCollection = await getTranslationsCollection()
  return await translationsCollection
    .find<Translation>({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray()
}

export async function getTranslationById(translationId: string): Promise<Translation | null> {
  const translationsCollection = await getTranslationsCollection()
  return await translationsCollection.findOne<Translation>({ _id: new ObjectId(translationId) })
}

export async function getAllTranslations(): Promise<Translation[]> {
  const translationsCollection = await getTranslationsCollection()
  return await translationsCollection.find<Translation>({}).sort({ createdAt: -1 }).toArray()
}

export async function deleteTranslation(translationId: string): Promise<boolean> {
  const translationsCollection = await getTranslationsCollection()
  const result = await translationsCollection.deleteOne({ _id: new ObjectId(translationId) })
  return result.deletedCount === 1
}

export async function getTranslationStats() {
  const translationsCollection = await getTranslationsCollection()

  const totalTranslations = await translationsCollection.countDocuments()
  const translationsByType = await translationsCollection
    .aggregate([
      {
        $group: {
          _id: "$translationType",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray()

  const translationsByLanguage = await translationsCollection
    .aggregate([
      {
        $group: {
          _id: "$language",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray()

  return {
    total: totalTranslations,
    byType: translationsByType,
    byLanguage: translationsByLanguage,
  }
}
