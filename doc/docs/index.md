---
title: Retro Future
description: "Come funziona la demo 3D di avstudio, e perché è fatta così."
sidebar_position: 0
slug: /
---

# Retro Future

Questo è il manuale tecnico di una città 3D che si esplora nel browser, dentro il mio
sito, senza installare niente. Demo su
[avstudio.ai/chi-siamo/retro-future](https://avstudio.ai/chi-siamo/retro-future/),
codice su [GitHub](https://github.com/ale-ehp/retro-future).

Racconta due cose insieme: **come funziona il sistema** e **come è stato costruito**.
Ogni affermazione tecnica viene da un file, un commit o un test, e i numeri portano la
data e il comando che li produce. Dove una scelta non ha una ragione scritta, lo dico
invece di inventarne una.

## Tre modi di leggerlo

**Se sviluppi, e la grafica non è il tuo mestiere.** Parti dal metodo e dai controlli,
la parte riusabile altrove:

1. [Come è organizzato il lavoro](./ingegneria/come-e-organizzato-il-lavoro.mdx): tappe, definizione di fatto, deleghe, cancelli.
2. [Qualità e controlli](./ingegneria/qualita-e-controlli.mdx): 160 test, typecheck a soglia, gate visivo, CI.
3. [Deploy e infrastruttura](./ingegneria/deploy-e-infrastruttura.mdx): il Worker Cloudflare, le rotte, la cache per tipo di file.
4. [Architettura](./come-funziona/architettura.mdx): 97 moduli ESM senza bundler, e perché.

**Se coordini progetti.** Il primo capitolo è scritto per te; il quarto è quello che di
solito manca:

1. [Come è organizzato il lavoro](./ingegneria/come-e-organizzato-il-lavoro.mdx), con i diagrammi a corsie.
2. [Come è stata costruita](./perche/come-e-stata-costruita.mdx): il metodo, le tappe, le cicatrici.
3. [Prestazioni](./ingegneria/prestazioni.mdx): obiettivi e misure, tenuti separati.
4. [Compromessi e cosa viene dopo](./ingegneria/compromessi.mdx): le rinunce, i debiti noti, cosa manca.

**Se ti interessa come è fatta la scena.** 10 capitoli, uno per sottosistema, dalla
[Visione](./perche/visione.mdx) al [Terminale contatti](./come-funziona/terminale-contatti.mdx),
passando per [Rendering](./come-funziona/rendering.mdx), [Il mondo](./come-funziona/il-mondo.mdx)
e [Personaggi](./come-funziona/personaggi.mdx).

## Come è fatto ogni capitolo

I capitoli tecnici hanno tutti la stessa forma, si salta al blocco che serve: cosa
vede l'utente, il problema, come funziona, perché così e non altrimenti, i numeri,
dove sta nel codice, e un ponte per chi viene dal backend. Dove un concetto è denso, un
riquadro lo spiega in 3 righe a chi lo incontra per la prima volta; il
[glossario](./riferimento/glossario.mdx) tiene 86 voci.
