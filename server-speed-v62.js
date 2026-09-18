import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const generatedPath = path.join(process.cwd(), ".runtime", "server-speed-v62.generated.mjs");

function replaceRequired(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`[server-speed-v62] patch not applied: ${label}`);
  return next;
}

let source = await fs.readFile(path.join(process.cwd(), "server-speed.js"), "utf8");

source = replaceRequired(
  source,
  /const FRONTEND_VERSION = "\d+";/,
  'const FRONTEND_VERSION = "62";',
  "frontend version"
);

source = replaceRequired(
  source,
  '  let patched = html.replace(/\\?v=\\d+/g, `?v=${FRONTEND_VERSION}`);',
  [
    '  let patched = html.replace(/\\?v=\\d+/g, `?v=${FRONTEND_VERSION}`);',
    "",
    '  patched = patched.replace(/<body class="([^"]*)">/, (_match, className) => {',
    '    const classes = className.includes("admin-command-v62") ? className : `${className} admin-command-v62`;',
    '    return `<body class="${classes}">`;',
    "  });",
  ].join("\n"),
  "admin body class"
);

source = replaceRequired(
  source,
  '  return patched.replace("</style>\\n </head>", `${extraCss}\\n  </style>\\n </head>`);',
  '  return patched.replace("</style>\\n </head>", `${extraCss}\\n${getAdminCommandCss()}\\n  </style>\\n </head>`);',
  "admin command css injection"
);

source = replaceRequired(
  source,
  "\nfunction patchAdminJs(adminJs) {",
  `
function getAdminCommandCss() {
  return \`
   .admin-body.admin-command-v62 {
    --bg: #07111f;
    --panel: #0f1b2d;
    --panel-2: #132238;
    --panel-3: #182a44;
    --line: rgba(148, 163, 184, .22);
    --line-strong: rgba(148, 163, 184, .38);
    --text: #eef5ff;
    --muted: #94a3b8;
    --blue: #38bdf8;
    --teal: #2dd4bf;
    --orange: #fb923c;
    --red: #fb7185;
    background: var(--bg) !important;
    color: var(--text) !important;
    font-size: 13px !important;
   }

   .admin-body.admin-command-v62 * {
    box-sizing: border-box;
    letter-spacing: 0 !important;
   }

   .admin-body.admin-command-v62 .admin-shell {
    display: grid !important;
    grid-template-columns: 220px minmax(0, 1fr) !important;
    min-height: 100vh !important;
    background:
     linear-gradient(180deg, rgba(56, 189, 248, .08), transparent 280px),
     var(--bg) !important;
   }

   .admin-body.admin-command-v62 .fleet-sidebar {
    width: 220px !important;
    min-width: 220px !important;
    height: 100vh !important;
    position: sticky !important;
    top: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
    padding: 18px 14px !important;
    background: #050b14 !important;
    border-right: 1px solid var(--line) !important;
    color: var(--text) !important;
   }

   .admin-body.admin-command-v62 .fleet-logo {
    display: grid !important;
    grid-template-columns: 58px 1fr !important;
    gap: 10px !important;
    align-items: center !important;
    padding: 10px !important;
    border: 1px solid var(--line) !important;
    border-radius: 12px !important;
    background: #0b1626 !important;
    box-shadow: none !important;
   }

   .admin-body.admin-command-v62 .fleet-logo img {
    width: 58px !important;
    height: 42px !important;
    padding: 4px !important;
    border-radius: 8px !important;
    background: #fff !important;
    object-fit: contain !important;
   }

   .admin-body.admin-command-v62 .fleet-logo h1,
   .admin-body.admin-command-v62 .fleet-logo p,
   .admin-body.admin-command-v62 .fleet-nav b {
    display: block !important;
   }

   .admin-body.admin-command-v62 .fleet-logo h1 {
    margin: 0 !important;
    color: var(--text) !important;
    font-size: 14px !important;
    line-height: 1.1 !important;
   }

   .admin-body.admin-command-v62 .fleet-logo p {
    margin: 2px 0 0 !important;
    color: var(--muted) !important;
    font-size: 10px !important;
    font-weight: 700 !important;
   }

   .admin-body.admin-command-v62 .fleet-nav {
    display: grid !important;
    gap: 8px !important;
   }

   .admin-body.admin-command-v62 .fleet-nav a {
    width: 100% !important;
    min-height: 42px !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 0 11px !important;
    border-radius: 10px !important;
    border: 1px solid transparent !important;
    background: transparent !important;
    color: #cbd5e1 !important;
    text-decoration: none !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-command-v62 .fleet-nav a:hover,
   .admin-body.admin-command-v62 .fleet-nav a.is-active {
    border-color: rgba(56, 189, 248, .32) !important;
    background: rgba(56, 189, 248, .11) !important;
    color: #fff !important;
   }

   .admin-body.admin-command-v62 .sidebar-footer,
   .admin-body.admin-command-v62 .admin-install-card,
   .admin-body.admin-command-v62 .data-command-center,
   .admin-body.admin-command-v62 #auditWidget,
   .admin-body.admin-command-v62 .dashboard-widget.status-widget:has(#systemStatus),
   .admin-body.admin-command-v62 .owner-panel {
    display: none !important;
   }

   .admin-body.admin-command-v62 .fleet-content {
    min-width: 0 !important;
    background: transparent !important;
   }

   .admin-body.admin-command-v62 .fleet-topbar {
    position: sticky !important;
    top: 0 !important;
    z-index: 40 !important;
    min-height: 62px !important;
    display: grid !important;
    grid-template-columns: minmax(280px, 440px) 1fr auto !important;
    gap: 12px !important;
    align-items: center !important;
    padding: 10px 18px !important;
    background: rgba(7, 17, 31, .94) !important;
    border-bottom: 1px solid var(--line) !important;
    box-shadow: none !important;
    backdrop-filter: blur(12px);
   }

   .admin-body.admin-command-v62 .topbar-left {
    min-width: 0 !important;
   }

   .admin-body.admin-command-v62 .global-search {
    height: 40px !important;
    max-width: 440px !important;
    border: 1px solid var(--line) !important;
    border-radius: 10px !important;
    background: #0b1626 !important;
    color: var(--text) !important;
    box-shadow: none !important;
   }

   .admin-body.admin-command-v62 .global-search input {
    color: var(--text) !important;
    font-size: 13px !important;
    font-weight: 700 !important;
   }

   .admin-body.admin-command-v62 .global-search input::placeholder {
    color: #718096 !important;
   }

   .admin-body.admin-command-v62 .topbar-actions {
    gap: 8px !important;
   }

   .admin-body.admin-command-v62 .topbar-actions > span,
   .admin-body.admin-command-v62 .topbar-actions > button,
   .admin-body.admin-command-v62 .topbar-actions > select,
   .admin-body.admin-command-v62 .topbar-actions > a {
    min-height: 38px !important;
    border-radius: 10px !important;
    border: 1px solid var(--line) !important;
    background: #0b1626 !important;
    color: var(--text) !important;
    box-shadow: none !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-command-v62 .system-health-pill {
    order: 99 !important;
    border-color: rgba(45, 212, 191, .35) !important;
    background: rgba(45, 212, 191, .12) !important;
    color: #99f6e4 !important;
   }

   .admin-body.admin-command-v62 .dashboard-main {
    display: grid !important;
    gap: 14px !important;
    padding: 18px !important;
    max-width: none !important;
   }

   .admin-body.admin-command-v62 .admin-hero {
    display: none !important;
   }

   .admin-body.admin-command-v62 .dashboard.hero-dashboard {
    display: grid !important;
    gap: 14px !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow: visible !important;
   }

   .admin-body.admin-command-v62 .dashboard-header {
    min-height: 78px !important;
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    gap: 12px !important;
    align-items: center !important;
    padding: 16px 18px !important;
    border: 1px solid var(--line) !important;
    border-radius: 16px !important;
    background:
     linear-gradient(135deg, rgba(56, 189, 248, .18), transparent 42%),
     linear-gradient(90deg, #0f1b2d, #0b1626) !important;
   }

   .admin-body.admin-command-v62 .dashboard-header span {
    color: var(--orange) !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-command-v62 .dashboard-header h2 {
    margin: 4px 0 0 !important;
    color: var(--text) !important;
    font-size: 28px !important;
    line-height: 1 !important;
   }

   .admin-body.admin-command-v62 .dashboard-actions {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: flex-end !important;
    gap: 8px !important;
   }

   .admin-body.admin-command-v62 .dashboard-actions button {
    min-height: 36px !important;
    padding: 0 12px !important;
    border-radius: 10px !important;
    border: 1px solid var(--line) !important;
    background: #132238 !important;
    color: var(--text) !important;
    box-shadow: none !important;
    font-size: 12px !important;
   }

   .admin-body.admin-command-v62 .dashboard-actions .danger,
   .admin-body.admin-command-v62 .dashboard-actions button.primary {
    border-color: rgba(251, 146, 60, .45) !important;
    background: var(--orange) !important;
    color: #111827 !important;
   }

   .admin-body.admin-command-v62 .admin-filter-panel {
    order: 1 !important;
    display: grid !important;
    grid-template-columns: 220px minmax(340px, 1fr) 230px 92px !important;
    gap: 10px !important;
    padding: 0 !important;
    background: transparent !important;
   }

   .admin-body.admin-command-v62 .admin-filter-panel label,
   .admin-body.admin-command-v62 .admin-filter-panel article,
   .admin-body.admin-command-v62 .history-selector,
   .admin-body.admin-command-v62 .vehicle-control-tools label {
    min-height: 54px !important;
    padding: 10px 12px !important;
    border: 1px solid var(--line) !important;
    border-radius: 12px !important;
    background: var(--panel) !important;
    color: var(--text) !important;
    box-shadow: none !important;
   }

   .admin-body.admin-command-v62 .admin-filter-panel span,
   .admin-body.admin-command-v62 .history-selector span,
   .admin-body.admin-command-v62 .vehicle-control-tools span,
   .admin-body.admin-command-v62 .control-room-strip span,
   .admin-body.admin-command-v62 .metrics span {
    color: var(--muted) !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-command-v62 select,
   .admin-body.admin-command-v62 input {
    color: var(--text) !important;
    background: transparent !important;
    font-size: 13px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-command-v62 .control-room-strip {
    order: 2 !important;
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 10px !important;
    padding: 0 !important;
   }

   .admin-body.admin-command-v62 .control-room-strip article,
   .admin-body.admin-command-v62 .metrics article,
   .admin-body.admin-command-v62 .site-overview-card,
   .admin-body.admin-command-v62 .dashboard-widget {
    border: 1px solid var(--line) !important;
    border-radius: 14px !important;
    background: var(--panel) !important;
    box-shadow: none !important;
   }

   .admin-body.admin-command-v62 .control-room-strip article {
    min-height: 96px !important;
    padding: 14px !important;
    border-top: 3px solid var(--teal) !important;
   }

   .admin-body.admin-command-v62 .control-room-strip article:nth-child(2) { border-top-color: var(--orange) !important; }
   .admin-body.admin-command-v62 .control-room-strip article:nth-child(3) { border-top-color: var(--blue) !important; }
   .admin-body.admin-command-v62 .control-room-strip article:nth-child(4) { border-top-color: #a78bfa !important; }

   .admin-body.admin-command-v62 .control-room-strip strong,
   .admin-body.admin-command-v62 .metrics strong {
    margin-top: 8px !important;
    color: var(--text) !important;
    font-size: 30px !important;
    line-height: 1 !important;
   }

   .admin-body.admin-command-v62 .control-room-strip small {
    color: var(--muted) !important;
    font-size: 11px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-command-v62 .site-overview-grid {
    order: 3 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 14px !important;
    padding: 0 !important;
   }

   .admin-body.admin-command-v62 .site-overview-card {
    min-height: 320px !important;
    padding: 16px !important;
    border-top: 4px solid var(--blue) !important;
    background:
     linear-gradient(180deg, rgba(56, 189, 248, .10), transparent 140px),
     var(--panel) !important;
   }

   .admin-body.admin-command-v62 .site-overview-card:nth-child(2) {
    border-top-color: var(--orange) !important;
    background:
     linear-gradient(180deg, rgba(251, 146, 60, .10), transparent 140px),
     var(--panel) !important;
   }

   .admin-body.admin-command-v62 .site-overview-card.active {
    border-color: rgba(45, 212, 191, .65) !important;
   }

   .admin-body.admin-command-v62 .site-overview-head {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    gap: 4px 14px !important;
    padding: 0 0 12px !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line) !important;
    background: transparent !important;
    color: var(--text) !important;
    text-align: left !important;
   }

   .admin-body.admin-command-v62 .site-overview-head span {
    color: var(--muted) !important;
    font-size: 12px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-command-v62 .site-overview-head strong {
    grid-row: 1 / span 2 !important;
    color: var(--text) !important;
    font-size: 44px !important;
    line-height: .9 !important;
   }

   .admin-body.admin-command-v62 .site-overview-head small {
    color: #cbd5e1 !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-command-v62 .site-vehicle-report-list {
    display: grid !important;
    gap: 8px !important;
    margin-top: 12px !important;
    max-height: 226px !important;
    overflow: auto !important;
    padding-right: 4px !important;
   }

   .admin-body.admin-command-v62 .site-vehicle-report-row,
   .admin-body.admin-command-v62 .vehicle-control-row,
   .admin-body.admin-command-v62 .history-row,
   .admin-body.admin-command-v62 .report-row,
   .admin-body.admin-command-v62 .vehicle-summary article {
    min-height: 48px !important;
    padding: 9px 11px !important;
    border: 1px solid var(--line) !important;
    border-radius: 10px !important;
    background: #0b1626 !important;
    color: var(--text) !important;
    box-shadow: none !important;
   }

   .admin-body.admin-command-v62 .site-vehicle-report-row strong,
   .admin-body.admin-command-v62 .vehicle-control-row strong,
   .admin-body.admin-command-v62 .history-row strong,
   .admin-body.admin-command-v62 .report-row strong,
   .admin-body.admin-command-v62 .vehicle-summary strong {
    color: var(--text) !important;
    font-size: 13px !important;
    line-height: 1.15 !important;
   }

   .admin-body.admin-command-v62 .site-vehicle-report-row small,
   .admin-body.admin-command-v62 .vehicle-control-row span,
   .admin-body.admin-command-v62 .history-row span,
   .admin-body.admin-command-v62 .report-row span,
   .admin-body.admin-command-v62 .vehicle-summary span {
    color: var(--muted) !important;
    font-size: 10px !important;
    line-height: 1.2 !important;
   }

   .admin-body.admin-command-v62 .site-vehicle-report-row em,
   .admin-body.admin-command-v62 .vehicle-control-actions a,
   .admin-body.admin-command-v62 .report-row a,
   .admin-body.admin-command-v62 .history-row a {
    color: var(--blue) !important;
    font-size: 10px !important;
    font-style: normal !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-command-v62 .metrics {
    order: 4 !important;
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 10px !important;
    padding: 0 !important;
   }

   .admin-body.admin-command-v62 .metrics article {
    min-height: 96px !important;
    padding: 14px !important;
   }

   .admin-body.admin-command-v62 .metrics article::before {
    width: 44px !important;
    height: 3px !important;
    border-radius: 999px !important;
   }

   .admin-body.admin-command-v62 .dashboard-card-grid {
    order: 5 !important;
    display: grid !important;
    grid-template-columns: minmax(390px, .9fr) minmax(520px, 1.1fr) !important;
    gap: 14px !important;
    padding: 0 !important;
   }

   .admin-body.admin-command-v62 .dashboard-widget {
    overflow: hidden !important;
   }

   .admin-body.admin-command-v62 .dashboard-widget > header {
    min-height: 58px !important;
    padding: 13px 15px !important;
    border-bottom: 1px solid var(--line) !important;
    background: #0b1626 !important;
   }

   .admin-body.admin-command-v62 .dashboard-widget > header h3 {
    color: var(--text) !important;
    font-size: 17px !important;
    line-height: 1.1 !important;
   }

   .admin-body.admin-command-v62 .dashboard-widget > header span {
    color: var(--muted) !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-command-v62 .vehicle-control-tools,
   .admin-body.admin-command-v62 .vehicle-control-summary,
   .admin-body.admin-command-v62 .vehicle-summary,
   .admin-body.admin-command-v62 .vehicle-history-list,
   .admin-body.admin-command-v62 .report-list {
    padding: 12px !important;
   }

   .admin-body.admin-command-v62 .vehicle-control-tools {
    max-width: none !important;
    grid-template-columns: minmax(260px, 460px) !important;
   }

   .admin-body.admin-command-v62 .vehicle-control-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 8px !important;
   }

   .admin-body.admin-command-v62 .vehicle-control-summary article {
    min-height: 60px !important;
    padding: 10px !important;
    border-radius: 10px !important;
    border: 1px solid var(--line) !important;
    background: #0b1626 !important;
   }

   .admin-body.admin-command-v62 .vehicle-control-list,
   .admin-body.admin-command-v62 .vehicle-history-list,
   .admin-body.admin-command-v62 .report-list {
    gap: 8px !important;
    max-height: 460px !important;
    overflow: auto !important;
   }

   .admin-body.admin-command-v62 .empty-state,
   .admin-body.admin-command-v62 .empty-site-report {
    display: block !important;
    padding: 12px !important;
    border: 1px dashed var(--line-strong) !important;
    border-radius: 10px !important;
    background: rgba(15, 27, 45, .68) !important;
    color: var(--muted) !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-command-v62 .user-management-widget {
    grid-column: 1 / -1 !important;
   }

   .admin-body.admin-command-v62 .user-row {
    min-height: 48px !important;
    padding: 9px 12px !important;
    border-bottom: 1px solid var(--line) !important;
   }

   @media (max-width: 1120px) {
    .admin-body.admin-command-v62 .admin-shell { grid-template-columns: 1fr !important; }
    .admin-body.admin-command-v62 .fleet-sidebar { display: none !important; }
    .admin-body.admin-command-v62 .fleet-topbar,
    .admin-body.admin-command-v62 .dashboard-header,
    .admin-body.admin-command-v62 .admin-filter-panel,
    .admin-body.admin-command-v62 .control-room-strip,
    .admin-body.admin-command-v62 .site-overview-grid,
    .admin-body.admin-command-v62 .metrics,
    .admin-body.admin-command-v62 .dashboard-card-grid {
     grid-template-columns: 1fr !important;
    }
   }\`;
}

function patchAdminJs(adminJs) {`,
  "admin command css helper"
);

await fs.mkdir(path.dirname(generatedPath), { recursive: true });
await fs.writeFile(generatedPath, source);
await import(pathToFileURL(generatedPath).href);
