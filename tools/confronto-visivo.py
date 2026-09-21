#!/usr/bin/env python3
"""Confronto fra due catture di tools/gate-visivo.mjs.

    python3 tools/confronto-visivo.py <dirBase> <dirNuova>

Esce 0 se non trova regressioni, 1 altrimenti.

COSA E' UN GATE E COSA NO, misurato e non assunto:

  welcome.png       0.0000% di differenza fra run a codice identico, sempre.
                    Gate duro, soglia 0.05%.
  scene-static.png  gate a 1.5% sul fotogramma IN FASE: la scena "statica" ha luci
                    che pulsano a tempo (LED all'orizzonte, nuvole), e due fotogrammi
                    a codice identico differiscono fino al 2.3% secondo la fase in cui
                    scatta la foto (misurato 2026-09-19 nella stessa sessione, a 3s di
                    distanza; a 11s lo 0.4%). Per questo il gate prende, fra i
                    fotogrammi della raffica scene-static-burst/ della cattura nuova,
                    quello piu' vicino a scene-static.png della baseline: una fase
                    diversa lo abbassa, una regressione vera li alza tutti. Il
                    fotogramma singolo viene stampato per informazione.
  scene-A.png       NON e' un gate. Su coppie a codice identico oscilla fra 0.4%
                    e 5.6%, con singole celle all'82%, perche' la folla cammina e
                    le board ciclano il testo e la cattura non e' agganciata alla
                    fase dell'animazione. Stampato solo come informazione.

L'impronta strutturale e' il controllo piu' forte: fra due run a codice identico
e' byte-identica tranne un insieme chiuso di contatori derivati dal delta time
reale, elencati in NOISE_PATTERNS. Se cambia qualcosa fuori da quella lista, e'
una modifica vera.

Se confronti contro un commit vecchio, misura anche quel commit contro se stesso
prima di attribuire un diff alle tue modifiche: su questo repo lo stesso commit
confrontato con se stesso ha gia' prodotto 2.07% sulla scena libera.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

PIXEL_THRESHOLD = 12   # differenza per canale sotto cui il pixel e' considerato uguale
# 16 e non 6 (2026-09-19): il bottone di avvio ha un pulse CSS che sborda dal proprio
# rettangolo. getBoundingClientRect() non conosce il box-shadow, quindi mascherando solo
# il rettangolo + 6 px il bagliore restava dentro il confronto. Misurato sul runner: la
# zona dei pixel diversi era x[466..813] y[414..507] contro un bottone a x[480..800]
# y[429..491], cioe' 14 px di sbordo su ogni lato, e faceva sforare welcome.png (0.0516%
# contro un gate dello 0.05%) senza che fosse cambiato niente. Con 14 il conto va a zero,
# 16 tiene un margine. Costa ~8.000 pixel in piu' non guardati su 1.024.000, tutti
# intorno a un bottone che pulsa.
MASK_PADDING = 16
GATES = {"welcome.png": 0.05, "scene-static.png": 1.5}
INFO_ONLY = ["scene-A.png"]

# Dove la scena statica non e' statica abbastanza, scene-static.png scende fra le
# informative. Serve sul runner di GitHub, e il perche' e' misurato, non supposto
# (2026-09-19): la foto vuole cadere a un istante fisso di performance.now() per
# allineare le fasi di luci e nuvole, ma senza GPU il thread e' cosi' occupato che
# l'attesa lo manca di sedici secondi (chiesto 300.000 ms, arrivata a 316.076). In
# sedici secondi le nuvole si spostano, e tre run con la demo identica hanno dato
# 2.11%, 7.71% e 8.19% contro un gate dell'1.5%. Quello che resta a fare da cancello
# li' e' welcome.png (0.0000% in tre run su tre) e l'impronta strutturale (0 scostamenti
# in tre run su tre), che e' anche quella che becca i cambi veri. Per far tornare
# scene-static un cancello anche li' bisogna congelare l'orologio della scena, cioe'
# togliere performance.now() dai quindici moduli che lo usano.
if os.environ.get("RF_COMPARE_STATIC_INFORMATIVO") == "1":
    INFO_ONLY = INFO_ONLY + ["scene-static.png"]
    GATES = {k: v for k, v in GATES.items() if k != "scene-static.png"}

# Campi che oscillano a codice identico: derivano dal dt reale del frame.
NOISE_PATTERNS = [re.compile(p) for p in [
    r"/(cityRoleBoard|cityDepartmentBoards)/(panelOpacity|textOpacity|textureUpdates)$",
    r"/(cityRoleBoard|cityDepartmentBoards)/boards\[\d+\]/(panelOpacity|textOpacity)$",
    r"/(cityRoleBoard|cityDepartmentBoards)/runtime/(revealSkips|poseSkips|revealWrites)$",
    r"/(cityRoleBoard|cityDepartmentBoards)/(nextSwitchAt|switchStartedAt|switchProgress)$",
    r"/(cityRoleBoard|cityDepartmentBoards)/boards\[\d+\]/(nextSwitchAt|switchStartedAt|switchProgress|totalCanvasDrawMs|lastCanvasDrawMs)$",
    # Dove il cartellone si trova nel suo giro di pagine quando scatta la foto: stessa
    # famiglia dei campi qui sopra, cambia fra due catture identiche (2026-09-18).
    r"/(cityRoleBoard|cityDepartmentBoards)/(switching|targetPage|textureUploadRequests)$",
    r"/(cityRoleBoard|cityDepartmentBoards)/boards\[\d+\]/(switching|targetPage|textureUpdates|textureUploadRequests)$",
    r"/contactTerminal/.*(Ms|At|Skips|Writes)$",
    # A che pagina del giro di testi sta il cartellone dei reparti quando scatta la foto:
    # il giro parte dalla fine del rivelo, che ha una durata diversa a ogni run, quindi a
    # istante fisso la pagina puo' essere un'altra. Visto il 2026-09-19 (pagina 0 vs 1 con
    # sei testi diversi): e' fase, non struttura. Il NUMERO di pagine e di testi resta
    # confrontato (le lunghezze delle liste).
    r"/cityDepartmentBoards/(page|cycle)$",
    r"/cityDepartmentBoards/items\[\d+\]$",
    r"/cityDepartmentBoards/boards\[\d+\]/(page|cycle)$",
    r"/cityDepartmentBoards/boards\[\d+\]/items\[\d+\]$",
]]


def is_noise(path):
    return any(r.search(path) for r in NOISE_PATTERNS)


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.int16)


def noise_key(name):
    if "welcome" in name:
        return "noiseBoxesWelcome"
    return "noiseBoxesStatic" if "static" in name else "noiseBoxesScene"


def pixel_diff(dir_a, dir_b, name, file_b=None):
    a, b = load(Path(dir_a) / name), load(file_b or (Path(dir_b) / name))
    if a.shape != b.shape:
        return None, f"{name}: DIMENSIONI DIVERSE {a.shape} vs {b.shape}"
    boxes = json.loads((Path(dir_a) / "fingerprint.json").read_text()).get(noise_key(name), [])
    mask = np.ones(a.shape[:2], dtype=bool)
    for box in boxes:
        # Gli estremi vanno portati dentro l'immagine PRIMA di affettare: un elemento
        # fuori schermo (il cursore a disco sta a -117,-117 finche' il mouse non entra)
        # da' un estremo negativo, che per numpy conta dal fondo e mascherava quasi tutto
        # il fotogramma, facendo passare qualunque regressione (2026-09-18).
        y0 = max(0, box["y"] - MASK_PADDING)
        x0 = max(0, box["x"] - MASK_PADDING)
        y1 = max(0, box["y"] + box["h"] + MASK_PADDING)
        x1 = max(0, box["x"] + box["w"] + MASK_PADDING)
        if y1 <= y0 or x1 <= x0:
            continue
        mask[y0:y1, x0:x1] = False
    delta = np.abs(a - b).max(axis=2)[mask]
    pct = 100.0 * (delta > PIXEL_THRESHOLD).sum() / delta.size if delta.size else 0.0
    return pct, f"{name}: diff={pct:.4f}%  medio={delta.mean():.3f}  max={int(delta.max())}"


def burst_frames(directory, name):
    """I fotogrammi della raffica di `name` in una cattura, se ci sono."""
    burst = Path(directory) / (name.replace(".png", "") + "-burst")
    return sorted(burst.glob("*.png")) if burst.is_dir() else []


def pixel_diff_in_phase(base, new, name):
    """Il fotogramma della raffica nuova piu' vicino alla baseline (e viceversa, se anche la
    baseline ha una raffica). Senza raffiche e' il confronto singolo di sempre."""
    single_pct, single_line = pixel_diff(base, new, name)
    if single_pct is None:
        return single_pct, single_line
    candidates = [(single_pct, "fotogramma singolo")]
    for frame in burst_frames(new, name):
        pct, _ = pixel_diff(base, new, name, file_b=frame)
        if pct is not None:
            candidates.append((pct, f"raffica nuova {frame.name}"))
    for frame in burst_frames(base, name):
        # la baseline in git tiene solo il fotogramma singolo; una raffica c'e' quando si
        # confrontano due catture fresche
        pct, _ = pixel_diff(new, base, name, file_b=frame)
        if pct is not None:
            candidates.append((pct, f"raffica base {frame.name}"))
    best_pct, best_from = min(candidates, key=lambda c: c[0])
    if len(candidates) == 1:
        return best_pct, single_line + "  (nessuna raffica: confronto singolo)"
    worst = max(c[0] for c in candidates)
    return best_pct, (f"{name}: in fase diff={best_pct:.4f}% ({best_from}; singolo {single_pct:.4f}%, "
                      f"peggiore {worst:.4f}% su {len(candidates)} fotogrammi)")


def walk(pa, pb, path, out):
    if type(pa) is not type(pb):
        numeric = all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in (pa, pb))
        if not numeric:
            out.append(f"TIPO {path}: {type(pa).__name__} vs {type(pb).__name__}")
        elif pa != pb and not is_noise(path):
            out.append(f"DIVERSO {path}: {pa!r} != {pb!r}")
        return
    if isinstance(pa, dict):
        for k in sorted(set(pa) - set(pb)):
            out.append(f"SOLO-BASE {path}/{k}")
        for k in sorted(set(pb) - set(pa)):
            out.append(f"SOLO-NUOVO {path}/{k}")
        for k in sorted(set(pa) & set(pb)):
            walk(pa[k], pb[k], f"{path}/{k}", out)
    elif isinstance(pa, list):
        if len(pa) != len(pb):
            out.append(f"LUNGHEZZA {path}: {len(pa)} vs {len(pb)}")
            return
        for i, (x, y) in enumerate(zip(pa, pb)):
            walk(x, y, f"{path}[{i}]", out)
    elif pa != pb and not is_noise(path):
        out.append(f"DIVERSO {path}: {pa!r} != {pb!r}")


def benign(failures):
    # ERR_ABORTED sulla traccia opus e' l'abort del preload media di Chromium.
    return [f for f in failures if not (f["url"].endswith("retro-future.opus") and f["err"] == "net::ERR_ABORTED")]


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    base, new = Path(sys.argv[1]), Path(sys.argv[2])
    a = json.loads((base / "fingerprint.json").read_text())
    b = json.loads((new / "fingerprint.json").read_text())

    problems = []
    walk(a["fingerprint"], b["fingerprint"], "", problems)
    if a["pageErrors"] != b["pageErrors"]:
        problems.append(f"ERRORI-DI-PAGINA base={a['pageErrors']} nuovo={b['pageErrors']}")
    # Il driver WebGL mette l'indirizzo del contesto dentro il messaggio
    # ([.WebGL-0x38fc00d73800]): cambia a ogni run e faceva fallire il confronto sul
    # runner a ogni giro, senza che fosse cambiato niente (2026-09-19, run 35450315581).
    indirizzo_gl = re.compile(r"\[\.WebGL-0x[0-9a-f]+\]")
    def noisy(d):
        return [
            {"type": c["type"], "text": indirizzo_gl.sub("[.WebGL-0xXXXX]", c["text"])}
            for c in d["consoleLog"] if c["type"] in ("error", "warning")
        ]
    if noisy(a) != noisy(b):
        problems.append(f"CONSOLE base={noisy(a)} nuovo={noisy(b)}")
    if benign(a["requestFailures"]) != benign(b["requestFailures"]):
        problems.append(f"RICHIESTE-FALLITE base={benign(a['requestFailures'])} nuovo={benign(b['requestFailures'])}")
    only_a, only_b = set(a["requests"]) - set(b["requests"]), set(b["requests"]) - set(a["requests"])
    # I moduli sotto src/ cambiano di numero quando main.js viene spezzato in domini
    # (tappa 5, 2026-09-19): un file in piu' o in meno li' e' topologia, non comportamento,
    # e un modulo mancante si vede comunque come richiesta fallita ed errore di pagina.
    # Tutto il resto (asset, audio, vendor) resta uno scostamento.
    is_module = lambda url: url.startswith("src/") and url.endswith(".js")
    modules_a, modules_b = {u for u in only_a if is_module(u)}, {u for u in only_b if is_module(u)}
    only_a, only_b = only_a - modules_a, only_b - modules_b
    if modules_a or modules_b:
        print(f"  [informativo] moduli src/ diversi: solo-base={sorted(modules_a)} solo-nuovo={sorted(modules_b)}")
    if only_a or only_b:
        problems.append(f"RICHIESTE solo-base={sorted(only_a)} solo-nuovo={sorted(only_b)}")

    print(f"=== IMPRONTA STRUTTURALE: {len(problems)} scostamenti ===")
    for p in problems[:60]:
        print("  " + p)
    if len(problems) > 60:
        print(f"  ... e altri {len(problems) - 60}")

    print("=== PIXEL (regioni di rumore mascherate) ===")
    pixel_failures = []
    for name in INFO_ONLY:
        _, line = pixel_diff(base, new, name)
        print(f"  [informativo, non e' un gate] {line}")
    for name, gate in GATES.items():
        pct, line = pixel_diff_in_phase(base, new, name)
        print("  " + line + f"   (gate {gate}%)")
        if pct is None or pct > gate:
            pixel_failures.append(name)

    print()
    if not problems and not pixel_failures:
        print("VERDETTO: NESSUNA REGRESSIONE")
        return 0
    print("VERDETTO: REGRESSIONE POSSIBILE, guarda gli scostamenti qui sopra")
    return 1


if __name__ == "__main__":
    sys.exit(main())
