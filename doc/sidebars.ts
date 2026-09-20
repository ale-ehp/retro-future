import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// Le quattro parti del manuale. Le voci si aggiungono man mano che i capitoli esistono:
// un id qui che non ha il file fa fallire il build, ed e' voluto.
const sidebars: SidebarsConfig = {
  manuale: [
    { type: "category", label: "Perche' e' fatto cosi'", collapsed: false, items: ["index"] },
  ],
};

export default sidebars;
