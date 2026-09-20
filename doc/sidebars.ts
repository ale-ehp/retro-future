import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// Le quattro parti del manuale. Ingegneria viene prima di Come funziona (2026-09-20): chi legge
// per valutare il lavoro cerca il metodo e i controlli, non il bloom. Un id senza file fa
// fallire il build, ed è voluto.
const sidebars: SidebarsConfig = {
  manuale: [
    "index",
    { type: "category", label: "Perché è fatto così", collapsed: false, items: ["perche/visione", "perche/come-e-stata-costruita"] },
    {
      type: "category",
      label: "Ingegneria",
      collapsed: false,
      items: [
        "ingegneria/come-e-organizzato-il-lavoro",
        "ingegneria/qualita-e-controlli",
        "ingegneria/deploy-e-infrastruttura",
        "ingegneria/prestazioni",
        "ingegneria/pannello-di-regia",
        "ingegneria/compromessi",
      ],
    },
    {
      type: "category",
      label: "Come funziona",
      collapsed: false,
      items: [
        "come-funziona/architettura",
        "come-funziona/rendering",
        "come-funziona/il-mondo",
        "come-funziona/cielo-e-atmosfera",
        "come-funziona/luce-e-riflessi",
        "come-funziona/personaggi",
        "come-funziona/camera-e-movimento",
        "come-funziona/audio",
        "come-funziona/il-rivelo-della-citta",
        "come-funziona/terminale-contatti",
      ],
    },
    {
      type: "category",
      label: "Riferimento",
      collapsed: false,
      items: ["riferimento/glossario", "riferimento/mappa-dei-file", "riferimento/numeri-misurati", "riferimento/crediti"],
    },
  ],
};

export default sidebars;
