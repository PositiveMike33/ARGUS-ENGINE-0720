/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';
import { RelatedMemory } from '../types';

let pineconeClient: Pinecone | null = null;
let pineconeIndex: any = null;

// Initialisation paresseuse (Lazy Initialization) sécurisée de Pinecone
export function getPineconeClient(): Pinecone | null {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.log('[VectorDb] PINECONE_API_KEY non configuré. Mode mémoire hybride PostgreSQL activé.');
    return null;
  }
  if (!pineconeClient) {
    try {
      pineconeClient = new Pinecone({ apiKey });
      console.log('[VectorDb] Client Pinecone initialisé avec succès.');
    } catch (err) {
      console.error('[VectorDb] Échec de l\'initialisation de Pinecone:', err);
    }
  }
  return pineconeClient;
}

export function getPineconeIndex() {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX || 'argus-memories';
  if (!client) return null;
  if (!pineconeIndex) {
    try {
      pineconeIndex = client.index(indexName);
      console.log(`[VectorDb] Index Pinecone connecté: ${indexName}`);
    } catch (err) {
      console.error(`[VectorDb] Impossible de se connecter à l'index Pinecone "${indexName}":`, err);
    }
  }
  return pineconeIndex;
}

/**
 * Génère le vecteur de plongement (embedding) pour un texte donné
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[VectorDb] GEMINI_API_KEY absente. Impossible de générer le plongement sémantique.');
    return null;
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text,
    }) as any;

    if (response?.embedding?.values) {
      return response.embedding.values;
    }
    if (response?.embeddings?.[0]?.values) {
      return response.embeddings[0].values;
    }
    if (response?.embedding && Array.isArray(response.embedding)) {
      return response.embedding;
    }
  } catch (err) {
    console.error('[VectorDb] Erreur lors de la génération de l\'embedding:', err);
  }
  return null;
}

/**
 * Upsert un résultat d'analyse ToT dans la base vectorielle Pinecone
 */
export async function upsertToTAnalysis(
  id: string,
  feedTitle: string,
  feedType: string,
  finalDecision: string,
  entropyScore: number,
  embedding: number[],
  metadata: Record<string, any> = {}
): Promise<boolean> {
  const index = getPineconeIndex();
  if (!index) {
    console.log('[VectorDb] Upsert Pinecone ignoré (Fallback local actif).');
    return false;
  }

  try {
    await index.upsert([
      {
        id,
        values: embedding,
        metadata: {
          feedTitle,
          feedType,
          finalDecision: finalDecision.substring(0, 1000), // Éviter la limite de taille des métadonnées Pinecone
          entropyScore,
          createdAt: new Date().toISOString(),
          ...metadata,
        },
      },
    ]);
    console.log(`[VectorDb] Upsert réussi sur Pinecone pour la décision: ${id}`);
    return true;
  } catch (err) {
    console.error('[VectorDb] Échec de l\'upsert sur Pinecone:', err);
    return false;
  }
}

/**
 * Recherche des analyses ToT similaires dans Pinecone
 */
export async function querySimilarToTAnalyses(
  embedding: number[],
  topK: number = 3
): Promise<RelatedMemory[]> {
  const index = getPineconeIndex();
  if (!index) {
    return [];
  }

  try {
    const queryResponse = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    const memories: RelatedMemory[] = [];
    if (queryResponse.matches) {
      for (const match of queryResponse.matches) {
        if (match.metadata) {
          memories.push({
            id: match.id,
            feedTitle: (match.metadata.feedTitle as string) || '',
            feedType: (match.metadata.feedType as any) || 'STM',
            finalDecision: (match.metadata.finalDecision as string) || '',
            entropyScore: Number(match.metadata.entropyScore) || 0,
            similarity: match.score || 0,
            createdAt: (match.metadata.createdAt as string) || undefined,
          });
        }
      }
    }
    return memories;
  } catch (err) {
    console.error('[VectorDb] Échec de la requête Pinecone:', err);
    return [];
  }
}

/**
 * Calcule la similarité cosinus entre deux vecteurs
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
