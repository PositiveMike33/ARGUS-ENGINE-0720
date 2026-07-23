/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'events';

export const telemetryEvents = new EventEmitter();
const sseClients = new Set<any>();

/**
 * Gestionnaire SSE Express pour ouvrir un canal de streaming en temps réel
 */
export function handleSSEConnection(req: any, res: any) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  sseClients.add(res);

  // Heartbeat toutes les 15s pour maintenir la connexion active
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
}

/**
 * Diffusion d'un ping ou d'une alerte SSE à tous les clients connectés
 */
export function broadcastEvent(eventType: string, payload: any) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch (err) {
      console.warn('[Argus SSE] Échec envoi client, suppression:', err);
      sseClients.delete(client);
    }
  }
}

// Écoute des événements télémétriques
telemetryEvents.on('ping_received', (data) => {
  broadcastEvent('telemetry_update', data);
});

telemetryEvents.on('anomaly_detected', (alert) => {
  broadcastEvent('alert_critical', alert);
});

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface TelemetryDataPoint {
  id?: string;
  agentId?: string;
  targetId?: string;
  lat: number;
  lng: number;
  altitude?: number;
  speed?: number;
  isAlertFlag?: boolean;
  timestamp?: string | Date;
  metadata?: Record<string, any>;
  receivedAt?: Date;
}

export interface MovementAnomalyReport {
  targetId?: string;
  type: 'IMPOSSIBLE_TRAVEL';
  severity: 'HIGH' | 'CRITICAL';
  details: {
    speedKmh: number;
    distanceKm: number;
    timeGapSeconds: number;
    from: GeoPoint;
    to: GeoPoint;
  };
  timestamp: string;
}

/**
 * Calcul de l'entropie d'information de Shannon (H_brut) sur les octets bruts.
 */
export function calculateShannonEntropy(dataBytes: Uint8Array | Buffer): number {
  if (!dataBytes || dataBytes.length === 0) return 0.0;
  const length = dataBytes.length;
  const freq: Record<number, number> = {};
  for (let i = 0; i < length; i++) {
    const byte = dataBytes[i];
    freq[byte] = (freq[byte] || 0) + 1;
  }
  let entropy = 0.0;
  for (const byte in freq) {
    const p_x = freq[byte] / length;
    entropy -= p_x * Math.log2(p_x);
  }
  return entropy;
}

/**
 * Génère le rapport de diagnostic d'entropie et de télémétrie ARGUS (Tree of Thoughts).
 */
export function generateArgusTelemetryReport(
  statusVeh: number,
  contentVeh: Uint8Array | Buffer,
  statusTrips: number,
  contentTrip: Uint8Array | Buffer
) {
  const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const hBrutVeh = calculateShannonEntropy(contentVeh);
  const hBrutTrip = calculateShannonEntropy(contentTrip);
  const lenVeh = contentVeh ? contentVeh.length : 0;
  const lenTrip = contentTrip ? contentTrip.length : 0;

  const hBrutAvg = (lenVeh > 0 && lenTrip > 0) ? (hBrutVeh + hBrutTrip) / 2.0 : Math.max(hBrutVeh, hBrutTrip);

  // Estimation du bruit et synthèse (Tree of Thoughts)
  // Réduction d'entropie : ΔH_télémétrie = H_brut - H_synthétisé
  const hSynthetise = hBrutAvg > 0 ? Math.min(hBrutAvg, 2.5) : 0.0;
  const deltaH = Math.max(0.0, hBrutAvg - hSynthetise);

  // Variance externe V_externe
  const vExterne = (statusVeh === 200 && statusTrips === 200) ? 0.15 : 0.85;
  const statusStr = statusVeh === 200 ? 'OPÉRATIONNEL' : 'ATTENTION_REQUISE';
  const directiveStr = vExterne < 0.5 ? 'Flux STM stable. Charge d\'entropie faible.' : 'Incertitude détectée sur les flux. Vérifier les connexions et la clé API.';

  const reportMarkdown = `---
title: Rapport Télémétrie STM GTFS-RT & Réduction d'Entropie
date: ${nowIso}
system: ARGUS Engine v2.0 / Ghost Foundry Ops
status: ${statusStr}
---

# 🛰️ ARGUS TELEMETRY REPORT — STM REAL-TIME

## 1. Statut des Connexions API STM
- **Endpoint VehiclePositions (v2.0)** : HTTP ${statusVeh} (${lenVeh} octets reçus)
- **Endpoint TripUpdates (v2.0)** : HTTP ${statusTrips} (${lenTrip} octets reçus)
- **Clé API Utilisée** : \`l78d7ad1bead...\`

## 2. Modélisation de l'Entropie Télémétrique
- **Entropie Shannon Brute ($H_{brut}$)** : ${hBrutAvg.toFixed(4)} bits/octet
- **Entropie Synthétisée ($H_{synthétisé}$)** : ${hSynthetise.toFixed(4)} bits/octet
- **Réduction d'Entropie ($\\Delta H_{télémétrie}$)** : ${deltaH.toFixed(4)} bits/octet (Gain d'information tactique)
- **Variance Opérationnelle Externe ($V_{externe}$)** : ${vExterne.toFixed(2)}

## 3. Intégration Somatique & Diagnostic
$$\\Delta S_{total} = S_{somatique} + \\gamma \\cdot V_{externe}$$
- **Directive d'Alignement** : ${directiveStr}

---
*Rapport généré automatiquement par le Moteur ARGUS — Fonderie Fantôme.*
`;

  return {
    argusDir: "D:/Vault/03_INFRASTRUCTURE_SYSTEME/ARGUS/Argus",
    reportMarkdown,
    jsonLatest: {
      status_veh: statusVeh,
      status_trip: statusTrips,
      timestamp: new Date().toISOString()
    },
    metrics: {
      hBrutVeh,
      hBrutTrip,
      hBrutAvg,
      hSynthetise,
      deltaH,
      vExterne,
      statusStr,
      directiveStr
    }
  };
}

/**
 * Calcul de distance entre deux points GPS (Formule de Haversine en km)
 */
export function haversineDistance(pt1: GeoPoint, pt2: GeoPoint): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((pt2.lat - pt1.lat) * Math.PI) / 180;
  const dLng = ((pt2.lng - pt1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pt1.lat * Math.PI) / 180) *
      Math.cos((pt2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Évalue un nouveau ping par rapport au dernier ping connu ("Impossible Travel").
 * @returns Objet rapport d'anomalie si détectée, sinon null.
 */
export function analyzeMovementAnomaly(
  previousPing: TelemetryDataPoint | null | undefined,
  currentPing: TelemetryDataPoint,
  maxSpeedKmh = 160
): MovementAnomalyReport | null {
  if (!previousPing) return null;

  const prevTime = previousPing.timestamp ? new Date(previousPing.timestamp).getTime() : (previousPing.receivedAt ? new Date(previousPing.receivedAt).getTime() : 0);
  const currTime = currentPing.timestamp ? new Date(currentPing.timestamp).getTime() : (currentPing.receivedAt ? new Date(currentPing.receivedAt).getTime() : Date.now());

  if (!prevTime || !currTime) return null;

  const distanceKm = haversineDistance(previousPing, currentPing);
  const timeDeltaHours = (currTime - prevTime) / (1000 * 60 * 60);

  if (timeDeltaHours <= 0) return null; // Horodatage invalide ou doublon

  const calculatedSpeed = distanceKm / timeDeltaHours;

  if (calculatedSpeed > maxSpeedKmh) {
    const anomaly: MovementAnomalyReport = {
      targetId: currentPing.targetId || currentPing.agentId || 'TARGET_UNKNOWN',
      type: 'IMPOSSIBLE_TRAVEL',
      severity: 'HIGH',
      details: {
        speedKmh: Math.round(calculatedSpeed),
        distanceKm: Number(distanceKm.toFixed(2)),
        timeGapSeconds: Math.round(timeDeltaHours * 3600),
        from: { lat: previousPing.lat, lng: previousPing.lng },
        to: { lat: currentPing.lat, lng: currentPing.lng }
      },
      timestamp: new Date().toISOString()
    };

    telemetryEvents.emit('anomaly_detected', anomaly);
    return anomaly;
  }

  return null;
}

/**
 * 1. Algorithme de Geofencing (Point-in-Polygon avec Ray-Casting)
 * Vérifie si une coordonnée (lat, lng) se trouve à l'intérieur d'un polygone (Geofence).
 */
export function isPointInZone(point: GeoPoint, polygon: GeoPoint[]): boolean {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * 2. Ingestion Haute-Fréquence avec Tampon (Buffer In-Memory)
 * Accumule les pings télémétriques et les insère par paquets (batch) à intervalles réguliers.
 */
export class TelemetryIngestor {
  private buffer: TelemetryDataPoint[] = [];
  private batchSize: number;
  private flushIntervalMs: number;
  private dbInsertCallback: (items: TelemetryDataPoint[]) => Promise<void>;
  private timer: NodeJS.Timeout | null = null;
  private totalIngestedCount = 0;
  private totalFlushedCount = 0;

  constructor(
    dbInsertCallback: (items: TelemetryDataPoint[]) => Promise<void>,
    batchSize = 50,
    flushIntervalMs = 5000
  ) {
    this.buffer = [];
    this.batchSize = batchSize;
    this.flushIntervalMs = flushIntervalMs;
    this.dbInsertCallback = dbInsertCallback;

    // Flush automatique selon le délai défini
    this.timer = setInterval(() => this.flush(), flushIntervalMs);
  }

  public push(dataPoint: TelemetryDataPoint): void {
    this.totalIngestedCount++;
    const enriched = { ...dataPoint, receivedAt: new Date() };
    this.buffer.push(enriched);

    // Diffusion de l'événement via SSE
    telemetryEvents.emit('ping_received', enriched);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const itemsToInsert = [...this.buffer];
    this.buffer = [];

    try {
      await this.dbInsertCallback(itemsToInsert);
      this.totalFlushedCount += itemsToInsert.length;
    } catch (error) {
      console.error("[Argus Ingestor] Échec de l'insertion par paquet:", error);
      // Réinjecte les éléments échoués au début du tampon en cas de défaillance
      this.buffer.unshift(...itemsToInsert);
    }
  }

  public getStats() {
    return {
      bufferSize: this.buffer.length,
      batchSize: this.batchSize,
      flushIntervalMs: this.flushIntervalMs,
      totalIngestedCount: this.totalIngestedCount,
      totalFlushedCount: this.totalFlushedCount
    };
  }

  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/**
 * 3. Purge Automatique des Données Anciennes (Retention Policy SQL / Memory)
 * Purge les pings obsolètes tout en conservant scrupuleusement les alertes critiques.
 */
export async function purgeObsoleteTelemetry(
  allPings: TelemetryDataPoint[],
  retentionDays = 30
): Promise<{ remainingPings: TelemetryDataPoint[]; purgedCount: number }> {
  const cutoffTime = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const remainingPings = allPings.filter((ping) => {
    const isOld = ping.receivedAt ? new Date(ping.receivedAt) < cutoffTime : false;
    // Conserver les alertes critiques (isAlertFlag === true) indépendamment de l'ancienneté
    if (ping.isAlertFlag) return true;
    return !isOld;
  });

  const purgedCount = allPings.length - remainingPings.length;
  return { remainingPings, purgedCount };
}
