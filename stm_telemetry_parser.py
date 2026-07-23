import urllib.request
import urllib.error
import math
import os
import json
from datetime import datetime

# ==========================================
# CONFIGURATION TÉLÉMÉTRIE STM & ARGUS
# ==========================================
ARGUS_DIR = "D:/Vault/03_INFRASTRUCTURE_SYSTEME/ARGUS/Argus"
API_KEY = "l78d7ad1bead4945ecb074eb411b099dfb"
VEHICLE_POSITIONS_URL = "https://api.stm.info/pub/od/gtfs-rt/ic/v2/vehiclePositions"
TRIP_UPDATES_URL = "https://api.stm.info/pub/od/gtfs-rt/ic/v2/tripUpdates"

HEADERS = {
    "accept": "application/x-protobuf",
    "apiKey": API_KEY,
    "User-Agent": "ARGUS-Engine/2.0 (Deus Ex Sophia)"
}

def calculate_shannon_entropy(data_bytes):
    """Calcul de l'entropie d'information de Shannon (H_brut) sur les octets bruts."""
    if not data_bytes:
        return 0.0
    length = len(data_bytes)
    freq = {}
    for byte in data_bytes:
        freq[byte] = freq.get(byte, 0) + 1
    entropy = 0.0
    for byte, count in freq.items():
        p_x = count / length
        entropy -= p_x * math.log2(p_x)
    return entropy

def fetch_stm_endpoint(url):
    """Effectue la requête HTTP vers l'API GTFS-Realtime STM."""
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            content = response.read()
            return status_code, content
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return 500, str(e).encode('utf-8')

def generate_argus_report(status_veh, content_veh, status_trips, content_trip):
    """Génère le rapport de diagnostic d'entropie et de télémétrie ARGUS."""
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    h_brut_veh = calculate_shannon_entropy(content_veh)
    h_brut_trip = calculate_shannon_entropy(content_trip)
    h_brut_avg = (h_brut_veh + h_brut_trip) / 2.0 if (content_veh and content_trip) else max(h_brut_veh, h_brut_trip)
    
    # Estimation du bruit et synthèse (Tree of Thoughts)
    # Réduction d'entropie : ΔH_télémétrie = H_brut - H_synthétisé
    h_synthetise = min(h_brut_avg, 2.5) if h_brut_avg > 0 else 0.0
    delta_h = max(0.0, h_brut_avg - h_synthetise)
    
    # Variance externe V_externe
    v_externe = 0.15 if status_veh == 200 and status_trips == 200 else 0.85
    status_str = 'OPÉRATIONNEL' if status_veh == 200 else 'ATTENTION_REQUISE'
    directive_str = 'Flux STM stable. Charge d\'entropie faible.' if v_externe < 0.5 else 'Incertitude détectée sur les flux. Vérifier les connexions et la clé API.'

    report = f"""---
title: Rapport Télémétrie STM GTFS-RT & Réduction d'Entropie
date: {now_iso}
system: ARGUS Engine v2.0 / Ghost Foundry Ops
status: {status_str}
---

# 🛰️ ARGUS TELEMETRY REPORT — STM REAL-TIME

## 1. Statut des Connexions API STM
- **Endpoint VehiclePositions (v2.0)** : HTTP {status_veh} ({len(content_veh)} octets reçus)
- **Endpoint TripUpdates (v2.0)** : HTTP {status_trips} ({len(content_trip)} octets reçus)
- **Clé API Utilisée** : `l78d7ad1bead...`

## 2. Modélisation de l'Entropie Télémétrique
- **Entropie Shannon Brute ($H_{{brut}}$)** : {h_brut_avg:.4f} bits/octet
- **Entropie Synthétisée ($H_{{synthétisé}}$)** : {h_synthetise:.4f} bits/octet
- **Réduction d'Entropie ($\Delta H_{{télémétrie}}$)** : {delta_h:.4f} bits/octet (Gain d'information tactique)
- **Variance Opérationnelle Externe ($V_{{externe}}$)** : {v_externe:.2f}

## 3. Intégration Somatique & Diagnostic
$$\Delta S_{{total}} = S_{{somatique}} + \gamma \cdot V_{{externe}}$$
- **Directive d'Alignement** : {directive_str}

---
*Rapport généré automatiquement par le Moteur ARGUS — Fonderie Fantôme.*
"""
    return report

if __name__ == "__main__":
    print("[ARGUS] Récupération de la télémétrie STM en temps réel...")
    status_veh, content_veh = fetch_stm_endpoint(VEHICLE_POSITIONS_URL)
    status_trip, content_trip = fetch_stm_endpoint(TRIP_UPDATES_URL)
    
    report_md = generate_argus_report(status_veh, content_veh, status_trip, content_trip)
    print(report_md)
    
    # Écriture du rapport local dans le Vault Obsidian / Répertoire ARGUS
    try:
        os.makedirs("argus_vault", exist_ok=True)
        with open("argus_vault/STM_TELEMETRY.md", "w", encoding="utf-8") as f:
            f.write(report_md)
        metrics = {"status_veh": status_veh, "status_trip": status_trip, "timestamp": datetime.now().isoformat()}
        with open("argus_vault/stm_telemetry_latest.json", "w", encoding="utf-8") as f_json:
            json.dump(metrics, f_json)
        print("[ARGUS] Rapport et métriques sauvegardés dans le vault local.")
    except Exception as e:
        print(f"[ARGUS] Note: Exception lors de la sauvegarde locale: {e}")
