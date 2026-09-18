import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const generatedPath = path.join(process.cwd(), ".runtime", "server-speed-v61.generated.mjs");

function replaceRequired(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`[server-speed-v61] patch not applied: ${label}`);
  }
  return next;
}

let source = await fs.readFile(path.join(process.cwd(), "server-speed.js"), "utf8");

source = replaceRequired(
  source,
  /const FRONTEND_VERSION = "\d+";/,
  'const FRONTEND_VERSION = "61";',
  "frontend version"
);

source = replaceRequired(
  source,
  '  let patched = html.replace(/\\?v=\\d+/g, `?v=${FRONTEND_VERSION}`);',
  [
    '  let patched = html.replace(/\\?v=\\d+/g, `?v=${FRONTEND_VERSION}`);',
    "",
    '  patched = patched.replace(/<body class="([^"]*)">/, (_match, className) => {',
    '    const classes = className.includes("admin-ops-v61") ? className : `${className} admin-ops-v61`;',
    '    return `<body class="${classes}">`;',
    "  });",
  ].join("\n"),
  "admin body class"
);

source = replaceRequired(
  source,
  '  return patched.replace("</style>\\n </head>", `${extraCss}\\n  </style>\\n </head>`);',
  '  return patched.replace("</style>\\n </head>", `${extraCss}\\n${getAdminOpsCss()}\\n  </style>\\n </head>`);',
  "admin ops css injection"
);

source = replaceRequired(
  source,
  "\nfunction patchAdminJs(adminJs) {",
  `
function getAdminOpsCss() {
  return \`
   .admin-body.admin-ops-v61 {
    --ink: #111827;
    --muted: #667085;
    --line: #d7e2ee;
    --panel: #ffffff;
    --blue: #174a73;
    --teal: #0f766e;
    --orange: #f28c00;
    background: #f3f6fa !important;
    color: var(--ink) !important;
    font-size: 13px !important;
   }
   .admin-body.admin-ops-v61 * { letter-spacing: 0 !important; box-sizing: border-box; }
   .admin-body.admin-ops-v61 .admin-shell {
    display: grid !important;
    grid-template-columns: 76px minmax(0, 1fr) !important;
    min-height: 100vh !important;
    background: #f3f6fa !important;
   }
   .admin-body.admin-ops-v61 .fleet-sidebar {
    width: 76px !important;
    min-width: 76px !important;
    padding: 10px 8px !important;
    background: #0f172a !important;
    border-right: 1px solid #1e293b !important;
    position: sticky !important;
    top: 0 !important;
    height: 100vh !important;
   }
   .admin-body.admin-ops-v61 .fleet-logo {
    display: grid !important;
    place-items: center !important;
    margin: 0 0 14px !important;
    padding: 0 !important;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
   }
   .admin-body.admin-ops-v61 .fleet-logo img {
    width: 52px !important;
    height: 38px !important;
    padding: 4px !important;
    border-radius: 8px !important;
    background: #fff !important;
    object-fit: contain !important;
   }
   .admin-body.admin-ops-v61 .fleet-logo h1,
   .admin-body.admin-ops-v61 .fleet-logo p,
   .admin-body.admin-ops-v61 .fleet-nav b,
   .admin-body.admin-ops-v61 .sidebar-footer,
   .admin-body.admin-ops-v61 .owner-panel,
   .admin-body.admin-ops-v61 .admin-install-card,
   .admin-body.admin-ops-v61 .data-command-center,
   .admin-body.admin-ops-v61 #auditWidget,
   .admin-body.admin-ops-v61 .dashboard-widget.status-widget:has(#systemStatus) {
    display: none !important;
   }
   .admin-body.admin-ops-v61 .fleet-nav { display: grid !important; gap: 7px !important; }
   .admin-body.admin-ops-v61 .fleet-nav a {
    width: 44px !important;
    height: 44px !important;
    margin: 0 auto !important;
    display: grid !important;
    place-items: center !important;
    padding: 0 !important;
    border-radius: 10px !important;
    color: #cbd5e1 !important;
    background: transparent !important;
    border: 1px solid transparent !important;
   }
   .admin-body.admin-ops-v61 .fleet-nav a:hover,
   .admin-body.admin-ops-v61 .fleet-nav a.is-active {
    color: #fff !important;
    background: #1e293b !important;
    border-color: #334155 !important;
   }
   .admin-body.admin-ops-v61 .fleet-content { min-width: 0 !important; background: #f3f6fa !important; }
   .admin-body.admin-ops-v61 .fleet-topbar {
    position: sticky !important;
    top: 0 !important;
    z-index: 30 !important;
    min-height: 56px !important;
    padding: 8px 14px !important;
    display: grid !important;
    grid-template-columns: minmax(280px, 500px) 1fr auto !important;
    gap: 10px !important;
    align-items: center !important;
    background: rgba(255, 255, 255, .96) !important;
    border-bottom: 1px solid var(--line) !important;
    box-shadow: 0 8px 22px rgba(15, 23, 42, .04) !important;
   }
   .admin-body.admin-ops-v61 .global-search {
    height: 38px !important;
    width: 100% !important;
    max-width: 500px !important;
    border: 1px solid var(--line) !important;
    border-radius: 8px !important;
    background: #fff !important;
    box-shadow: none !important;
   }
   .admin-body.admin-ops-v61 .global-search input {
    height: 36px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
   }
   .admin-body.admin-ops-v61 .topbar-actions { gap: 8px !important; }
   .admin-body.admin-ops-v61 .topbar-actions > span,
   .admin-body.admin-ops-v61 .topbar-actions > button,
   .admin-body.admin-ops-v61 .topbar-actions > select,
   .admin-body.admin-ops-v61 .topbar-actions > a {
    min-height: 36px !important;
    border-radius: 8px !important;
    border: 1px solid var(--line) !important;
    background: #fff !important;
    box-shadow: none !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }
   .admin-body.admin-ops-v61 .system-health-pill {
    order: 30;
    min-height: 34px !important;
    padding: 0 11px !important;
    border-radius: 999px !important;
    font-size: 11px !important;
    text-transform: uppercase;
   }
   .admin-body.admin-ops-v61 .dashboard-main {
    padding: 14px !important;
    max-width: none !important;
    display: grid !important;
    gap: 12px !important;
   }
   .admin-body.admin-ops-v61 .admin-hero {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 210px 210px !important;
    gap: 10px !important;
    min-height: auto !important;
    padding: 14px !important;
    border: 1px solid var(--line) !important;
    border-radius: 10px !important;
    background: #fff !important;
    box-shadow: none !important;
    overflow: hidden !important;
   }
   .admin-body.admin-ops-v61 .admin-hero::before,
   .admin-body.admin-ops-v61 .admin-hero::after { display: none !important; }
   .admin-body.admin-ops-v61 .admin-hero-copy { padding: 0 !important; background: transparent !important; color: var(--ink) !important; }
   .admin-body.admin-ops-v61 .admin-hero-copy span {
    color: var(--orange) !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }
   .admin-body.admin-ops-v61 .admin-hero-copy h1,
   .admin-body.admin-ops-v61 .admin-hero-copy h2 {
    margin: 3px 0 4px !important;
    color: var(--ink) !important;
    font-size: 24px !important;
    line-height: 1.1 !important;
    font-weight: 900 !important;
   }
   .admin-body.admin-ops-v61 .admin-hero-copy p {
    margin: 0 !important;
    color: var(--muted) !important;
    font-size: 13px !important;
    line-height: 1.35 !important;
   }
   .admin-body.admin-ops-v61 .hero-status-grid { display: contents !important; }
   .admin-body.admin-ops-v61 .hero-status-grid article {
    min-height: 86px !important;
    padding: 12px !important;
    border-radius: 9px !important;
    border: 1px solid var(--line) !important;
    border-left: 4px solid var(--teal) !important;
    background: #fbfdff !important;
    box-shadow: none !important;
   }
   .admin-body.admin-ops-v61 .hero-status-grid article:nth-child(2) { border-left-color: var(--orange) !important; }
   .admin-body.admin-ops-v61 .hero-status-grid span,
   .admin-body.admin-ops-v61 .dashboard-header span,
   .admin-body.admin-ops-v61 .admin-filter-panel span,
   .admin-body.admin-ops-v61 .history-selector span,
   .admin-body.admin-ops-v61 .vehicle-control-tools span,
   .admin-body.admin-ops-v61 .control-room-strip span,
   .admin-body.admin-ops-v61 .metrics span {
    font-size: 9px !important;
    color: var(--muted) !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }
   .admin-body.admin-ops-v61 .hero-status-grid strong {
    display: inline-flex !important;
    margin-top: 9px !important;
    padding: 5px 9px !important;
    border-radius: 999px !important;
    background: #dcfce7 !important;
    color: #166534 !important;
    font-size: 12px !important;
    font-weight: 900 !important;
   }
   .admin-body.admin-ops-v61 .dashboard.hero-dashboard {
    border: 1px solid var(--line) !important;
    border-radius: 10px !important;
    background: #fff !important;
    box-shadow: none !important;
    overflow: hidden !important;
   }
   .admin-body.admin-ops-v61 .dashboard-header {
    min-height: 58px !important;
    padding: 11px 14px !important;
    gap: 10px !important;
    border-bottom: 1px solid var(--line) !important;
    background: #fff !important;
   }
   .admin-body.admin-ops-v61 .dashboard-header span { color: var(--teal) !important; }
   .admin-body.admin-ops-v61 .dashboard-header h2 {
    margin: 2px 0 0 !important;
    font-size: 22px !important;
    line-height: 1.05 !important;
    color: var(--ink) !important;
   }
   .admin-body.admin-ops-v61 .dashboard-actions { display: flex !important; gap: 8px !important; }
   .admin-body.admin-ops-v61 .dashboard-actions button {
    min-height: 34px !important;
    padding: 0 12px !important;
    border-radius: 8px !important;
    font-size: 12px !important;
    box-shadow: none !important;
   }
   .admin-body.admin-ops-v61 .admin-filter-panel {
    grid-template-columns: minmax(160px, 220px) minmax(320px, 1fr) minmax(180px, 230px) 98px !important;
    gap: 8px !important;
    padding: 10px 14px !important;
    background: #fff !important;
   }
   .admin-body.admin-ops-v61 .admin-filter-panel label,
   .admin-body.admin-ops-v61 .admin-filter-panel article,
   .admin-body.admin-ops-v61 .history-selector,
   .admin-body.admin-ops-v61 .vehicle-control-tools label {
    min-height: 46px !important;
    padding: 8px 10px !important;
    border-radius: 8px !important;
    border: 1px solid var(--line) !important;
    background: #fff !important;
    box-shadow: none !important;
   }
   .admin-body.admin-ops-v61 select,
   .admin-body.admin-ops-v61 input {
    font-size: 12px !important;
    font-weight: 800 !important;
    color: var(--ink) !important;
   }
   .admin-body.admin-ops-v61 .control-room-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 8px !important;
    padding: 0 14px 10px !important;
   }
   .admin-body.admin-ops-v61 .control-room-strip article,
   .admin-body.admin-ops-v61 .metrics article,
   .admin-body.admin-ops-v61 .site-overview-card,
   .admin-body.admin-ops-v61 .dashboard-widget {
    border-radius: 9px !important;
    border: 1px solid var(--line) !important;
    background: #fff !important;
    box-shadow: none !important;
   }
   .admin-body.admin-ops-v61 .control-room-strip article {
    min-height: 74px !important;
    padding: 10px 12px !important;
    border-left: 4px solid var(--teal) !important;
   }
   .admin-body.admin-ops-v61 .control-room-strip article:nth-child(2) { border-left-color: var(--orange) !important; }
   .admin-body.admin-ops-v61 .control-room-strip article:nth-child(3) { border-left-color: var(--blue) !important; }
   .admin-body.admin-ops-v61 .control-room-strip article:nth-child(4) { border-left-color: #7c3aed !important; }
   .admin-body.admin-ops-v61 .control-room-strip strong,
   .admin-body.admin-ops-v61 .metrics strong {
    margin-top: 5px !important;
    color: var(--ink) !important;
    font-size: 24px !important;
    line-height: 1 !important;
   }
   .admin-body.admin-ops-v61 .control-room-strip small {
    margin-top: 4px !important;
    color: var(--muted) !important;
    font-size: 10px !important;
    font-weight: 800 !important;
   }
   .admin-body.admin-ops-v61 .metrics {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 8px !important;
    padding: 0 14px 10px !important;
   }
   .admin-body.admin-ops-v61 .metrics article { min-height: 66px !important; padding: 10px 12px !important; }
   .admin-body.admin-ops-v61 .metrics article::before { width: 34px !important; height: 3px !important; border-radius: 999px !important; }
   .admin-body.admin-ops-v61 .metrics strong { color: var(--blue) !important; }
   .admin-body.admin-ops-v61 .site-overview-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    padding: 0 14px 10px !important;
   }
   .admin-body.admin-ops-v61 .site-overview-card {
    padding: 10px !important;
    border-left: 4px solid var(--blue) !important;
   }
   .admin-body.admin-ops-v61 .site-overview-card.active {
    border-color: var(--teal) !important;
    background: #f8fffc !important;
   }
   .admin-body.admin-ops-v61 .site-overview-head {
    grid-template-columns: minmax(0, 1fr) auto !important;
    gap: 3px 10px !important;
    align-items: center !important;
   }
   .admin-body.admin-ops-v61 .site-overview-head span {
    grid-column: auto !important;
    color: var(--muted) !important;
    font-size: 10px !important;
    text-transform: uppercase !important;
    font-weight: 900 !important;
   }
   .admin-body.admin-ops-v61 .site-overview-head strong {
    grid-row: 1 / span 2 !important;
    grid-column: 2 !important;
    color: var(--ink) !important;
    font-size: 28px !important;
    line-height: 1 !important;
   }
   .admin-body.admin-ops-v61 .site-overview-head small {
    grid-column: 1 !important;
    color: var(--muted) !important;
    font-size: 10px !important;
   }
   .admin-body.admin-ops-v61 .site-vehicle-report-list {
    margin-top: 9px !important;
    display: grid !important;
    gap: 5px !important;
    max-height: 158px !important;
    overflow: auto !important;
   }
   .admin-body.admin-ops-v61 .site-vehicle-report-row,
   .admin-body.admin-ops-v61 .vehicle-control-row,
   .admin-body.admin-ops-v61 .history-row,
   .admin-body.admin-ops-v61 .report-row,
   .admin-body.admin-ops-v61 .vehicle-summary article {
    min-height: 42px !important;
    padding: 7px 9px !important;
    border-radius: 7px !important;
    border: 1px solid #e0e8f2 !important;
    background: #fff !important;
    box-shadow: none !important;
   }
   .admin-body.admin-ops-v61 .site-vehicle-report-row strong,
   .admin-body.admin-ops-v61 .vehicle-control-row strong,
   .admin-body.admin-ops-v61 .history-row strong,
   .admin-body.admin-ops-v61 .report-row strong,
   .admin-body.admin-ops-v61 .vehicle-summary strong {
    font-size: 12px !important;
    line-height: 1.15 !important;
    color: var(--ink) !important;
   }
   .admin-body.admin-ops-v61 .site-vehicle-report-row small,
   .admin-body.admin-ops-v61 .vehicle-control-row span,
   .admin-body.admin-ops-v61 .history-row span,
   .admin-body.admin-ops-v61 .report-row span,
   .admin-body.admin-ops-v61 .vehicle-summary span {
    font-size: 10px !important;
    line-height: 1.2 !important;
    color: var(--muted) !important;
   }
   .admin-body.admin-ops-v61 .site-vehicle-report-row em,
   .admin-body.admin-ops-v61 .vehicle-control-actions a,
   .admin-body.admin-ops-v61 .report-row a,
   .admin-body.admin-ops-v61 .history-row a {
    font-size: 10px !important;
    font-weight: 900 !important;
    color: var(--blue) !important;
    text-transform: uppercase !important;
   }
   .admin-body.admin-ops-v61 .dashboard-card-grid {
    display: grid !important;
    grid-template-columns: minmax(360px, .85fr) minmax(460px, 1.15fr) !important;
    gap: 10px !important;
    padding: 0 14px 14px !important;
   }
   .admin-body.admin-ops-v61 .dashboard-widget { overflow: hidden !important; }
   .admin-body.admin-ops-v61 .dashboard-widget > header {
    min-height: 52px !important;
    padding: 10px 12px !important;
    border-bottom: 1px solid #e4ecf5 !important;
    background: #fff !important;
   }
   .admin-body.admin-ops-v61 .dashboard-widget > header h3 {
    font-size: 16px !important;
    line-height: 1.1 !important;
    color: var(--ink) !important;
   }
   .admin-body.admin-ops-v61 .dashboard-widget > header span {
    margin-top: 2px !important;
    color: var(--muted) !important;
    font-size: 9px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }
   .admin-body.admin-ops-v61 .vehicle-control-tools,
   .admin-body.admin-ops-v61 .vehicle-control-summary,
   .admin-body.admin-ops-v61 .vehicle-summary,
   .admin-body.admin-ops-v61 .vehicle-history-list,
   .admin-body.admin-ops-v61 .report-list { padding: 10px 12px !important; }
   .admin-body.admin-ops-v61 .vehicle-control-tools {
    max-width: none !important;
    grid-template-columns: minmax(220px, 420px) !important;
   }
   .admin-body.admin-ops-v61 .vehicle-control-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 7px !important;
   }
   .admin-body.admin-ops-v61 .vehicle-control-summary article {
    min-height: 54px !important;
    padding: 8px 9px !important;
    border-radius: 8px !important;
    border: 1px solid var(--line) !important;
    background: #fafcff !important;
   }
   .admin-body.admin-ops-v61 .vehicle-control-summary strong { font-size: 20px !important; }
   .admin-body.admin-ops-v61 .vehicle-control-list,
   .admin-body.admin-ops-v61 .vehicle-history-list,
   .admin-body.admin-ops-v61 .report-list {
    gap: 5px !important;
    max-height: 430px !important;
    overflow: auto !important;
   }
   .admin-body.admin-ops-v61 .empty-state,
   .admin-body.admin-ops-v61 .empty-site-report {
    padding: 10px !important;
    border-radius: 8px !important;
    border: 1px dashed var(--line) !important;
    color: var(--muted) !important;
    background: #fbfdff !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }
   .admin-body.admin-ops-v61 .user-management-widget { grid-column: 1 / -1 !important; }
   .admin-body.admin-ops-v61 .user-row {
    min-height: 44px !important;
    padding: 7px 10px !important;
    border-bottom: 1px solid #e4ecf5 !important;
   }
   @media (max-width: 1100px) {
    .admin-body.admin-ops-v61 .admin-shell { grid-template-columns: 1fr !important; }
    .admin-body.admin-ops-v61 .fleet-sidebar { display: none !important; }
    .admin-body.admin-ops-v61 .fleet-topbar,
    .admin-body.admin-ops-v61 .admin-hero,
    .admin-body.admin-ops-v61 .dashboard-card-grid,
    .admin-body.admin-ops-v61 .site-overview-grid,
    .admin-body.admin-ops-v61 .control-room-strip,
    .admin-body.admin-ops-v61 .metrics,
    .admin-body.admin-ops-v61 .admin-filter-panel { grid-template-columns: 1fr !important; }
   }\`;
}

function patchAdminJs(adminJs) {`,
  "admin ops css helper"
);

await fs.mkdir(path.dirname(generatedPath), { recursive: true });
await fs.writeFile(generatedPath, source);
await import(pathToFileURL(generatedPath).href);
