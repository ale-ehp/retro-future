// Il manuale tecnico di Retro Future. Vive accanto a src/ (come av-crm/doc) e viene
// pubblicato da un Worker suo su avstudio.ai/chi-siamo/retro-future/doc/. Italiano
// oggi, inglese predisposto. Vedi docs/superpowers/specs/2026-09-20-retro-future-manuale-design.md.
import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";

const config: Config = {
  title: "Retro Future",
  tagline: "Come funziona la demo, e perché è fatta così",
  favicon: "favicon.svg",
  url: process.env.DOCS_URL ?? "https://avstudio.ai",
  baseUrl: process.env.DOCS_BASE_URL ?? "/chi-siamo/retro-future/doc/",
  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",
  markdown: { mermaid: true, hooks: { onBrokenMarkdownLinks: "throw" } },
  themes: ["@docusaurus/theme-mermaid"],
  i18n: { defaultLocale: "it", locales: ["it"] },
  presets: [
    [
      "classic",
      {
        docs: { sidebarPath: "./sidebars.ts", routeBasePath: "/", editUrl: undefined },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      },
    ],
  ],
  themeConfig: {
    image: "img/copertina.png",
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: "retro future",
      items: [
        { type: "docSidebar", sidebarId: "manuale", position: "left", label: "Manuale" },
        { href: "https://avstudio.ai/chi-siamo/retro-future/", label: "Apri la demo", position: "right" },
        { href: "https://github.com/ale-ehp/retro-future", label: "Codice", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        { title: "avstudio", items: [{ label: "avstudio.ai", href: "https://avstudio.ai/" }, { label: "La demo", href: "https://avstudio.ai/chi-siamo/retro-future/" }] },
      ],
      copyright: `avstudio, ${new Date().getFullYear()}. Testo dell'autore; codice della demo su GitHub.`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula, additionalLanguages: ["glsl", "bash", "json"] },
    mermaid: { theme: { light: "neutral", dark: "dark" } },
  },
};

export default config;
