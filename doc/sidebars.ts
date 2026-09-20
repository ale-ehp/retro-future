import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// Le quattro parti del manuale. Le voci si aggiungono man mano che i capitoli esistono:
// un id qui che non ha il file fa fallire il build, ed è voluto.
const sidebars: SidebarsConfig = {
  manuale: [
    "index",
    { type: "category", label: "Perché è fatto così", collapsed: false, items: ["perche/visione", "perche/come-e-stata-costruita"] },
  ],
};

export default sidebars;
