import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const generatedPath = path.join(process.cwd(), ".runtime", "server-speed-v63.generated.mjs");

function replaceRequired(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`[server-speed-v63] patch not applied: ${label}`);
  return next;
}

let source = await fs.readFile(path.join(process.cwd(), "server-speed.js"), "utf8");

source = replaceRequired(
  source,
  /const FRONTEND_VERSION = "\d+";/,
  'const FRONTEND_VERSION = "63";',
  "frontend version"
);

source = replaceRequired(
  source,
  '  let patched = html.replace(/\\?v=\\d+/g, `?v=${FRONTEND_VERSION}`);',
  [
    '  let patched = html.replace(/\\?v=\\d+/g, `?v=${FRONTEND_VERSION}`);',
    "",
    '  patched = patched.replace(/<body class="([^"]*)">/, (_match, className) => {',
    '    const classes = className.includes("admin-natural-v63") ? className : `${className} admin-natural-v63`;',
    '    return `<body class="${classes}">`;',
    "  });",
  ].join("\n"),
  "admin body class"
);

source = replaceRequired(
  source,
  '  return patched.replace("</style>\\n </head>", `${extraCss}\\n  </style>\\n </head>`);',
  '  return patched.replace("</style>\\n </head>", `${extraCss}\\n${getAdminNaturalCss()}\\n  </style>\\n </head>`);',
  "admin natural css injection"
);

source = replaceRequired(
  source,
  "\nfunction patchAdminJs(adminJs) {",
  `
function getAdminNaturalCss() {
  return \`
   .admin-body.admin-natural-v63 {
    --page: #f6f7f9;
    --paper: #ffffff;
    --ink: #172033;
    --soft-ink: #44546a;
    --muted: #728197;
    --line: #dbe3ec;
    --line-soft: #edf1f5;
    --brand: #174a73;
    --teal: #0f766e;
    --orange: #e97912;
    --red: #dc2626;
    background: var(--page) !important;
    color: var(--ink) !important;
    font-size: 13px !important;
   }

   .admin-body.admin-natural-v63 * {
    box-sizing: border-box;
    letter-spacing: 0 !important;
   }

   .admin-body.admin-natural-v63 .admin-shell {
    display: grid !important;
    grid-template-columns: 188px minmax(0, 1fr) !important;
    min-height: 100vh !important;
    background: var(--page) !important;
   }

   .admin-body.admin-natural-v63 .fleet-sidebar {
    width: 188px !important;
    min-width: 188px !important;
    height: 100vh !important;
    position: sticky !important;
    top: 0 !important;
    padding: 18px 14px !important;
    background: var(--paper) !important;
    border-right: 1px solid var(--line) !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .fleet-logo {
    display: block !important;
    padding: 0 0 18px !important;
    margin: 0 0 12px !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line-soft) !important;
    background: transparent !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .fleet-logo img {
    width: 118px !important;
    height: 48px !important;
    padding: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    object-fit: contain !important;
   }

   .admin-body.admin-natural-v63 .fleet-logo h1 {
    display: block !important;
    margin: 8px 0 0 !important;
    color: var(--ink) !important;
    font-size: 14px !important;
    line-height: 1.1 !important;
   }

   .admin-body.admin-natural-v63 .fleet-logo p {
    display: block !important;
    margin: 3px 0 0 !important;
    color: var(--muted) !important;
    font-size: 10px !important;
    font-weight: 700 !important;
   }

   .admin-body.admin-natural-v63 .fleet-nav {
    display: grid !important;
    gap: 2px !important;
   }

   .admin-body.admin-natural-v63 .fleet-nav a {
    min-height: 36px !important;
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    gap: 9px !important;
    padding: 0 8px !important;
    border: 0 !important;
    border-left: 3px solid transparent !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--soft-ink) !important;
    box-shadow: none !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    text-decoration: none !important;
   }

   .admin-body.admin-natural-v63 .fleet-nav b {
    display: inline !important;
   }

   .admin-body.admin-natural-v63 .fleet-nav a:hover,
   .admin-body.admin-natural-v63 .fleet-nav a.is-active {
    border-left-color: var(--orange) !important;
    color: var(--ink) !important;
    background: #f7f9fb !important;
   }

   .admin-body.admin-natural-v63 .sidebar-footer,
   .admin-body.admin-natural-v63 .admin-install-card,
   .admin-body.admin-natural-v63 .owner-panel,
   .admin-body.admin-natural-v63 .data-command-center,
   .admin-body.admin-natural-v63 #auditWidget,
   .admin-body.admin-natural-v63 .dashboard-widget.status-widget:has(#systemStatus) {
    display: none !important;
   }

   .admin-body.admin-natural-v63 .fleet-content {
    min-width: 0 !important;
    background: transparent !important;
   }

   .admin-body.admin-natural-v63 .fleet-topbar {
    position: sticky !important;
    top: 0 !important;
    z-index: 30 !important;
    display: grid !important;
    grid-template-columns: minmax(260px, 440px) 1fr auto !important;
    gap: 14px !important;
    align-items: center !important;
    min-height: 58px !important;
    padding: 8px 22px !important;
    background: rgba(246, 247, 249, .96) !important;
    border-bottom: 1px solid var(--line) !important;
    box-shadow: none !important;
    backdrop-filter: blur(10px);
   }

   .admin-body.admin-natural-v63 .global-search {
    height: 38px !important;
    max-width: 440px !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line) !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .global-search input {
    height: 38px !important;
    color: var(--ink) !important;
    font-size: 13px !important;
    font-weight: 700 !important;
   }

   .admin-body.admin-natural-v63 .topbar-actions {
    gap: 6px !important;
   }

   .admin-body.admin-natural-v63 .topbar-actions > span,
   .admin-body.admin-natural-v63 .topbar-actions > button,
   .admin-body.admin-natural-v63 .topbar-actions > select,
   .admin-body.admin-natural-v63 .topbar-actions > a {
    min-height: 34px !important;
    padding: 0 9px !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--soft-ink) !important;
    box-shadow: none !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-natural-v63 .topbar-actions > button:hover,
   .admin-body.admin-natural-v63 .topbar-actions > a:hover {
    color: var(--ink) !important;
    background: #eef3f8 !important;
   }

   .admin-body.admin-natural-v63 .system-health-pill {
    order: 99 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 7px !important;
    min-height: 30px !important;
    padding: 0 10px !important;
    border: 1px solid #bde8d7 !important;
    border-radius: 999px !important;
    background: #f0fbf6 !important;
    color: #0f7a49 !important;
    font-size: 11px !important;
    font-weight: 900 !important;
   }

   .admin-body.admin-natural-v63 .dashboard-main {
    max-width: 1500px !important;
    margin: 0 auto !important;
    padding: 22px !important;
    display: grid !important;
    gap: 18px !important;
   }

   .admin-body.admin-natural-v63 .admin-hero {
    display: none !important;
   }

   .admin-body.admin-natural-v63 .dashboard.hero-dashboard {
    display: grid !important;
    gap: 18px !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow: visible !important;
   }

   .admin-body.admin-natural-v63 .dashboard-header {
    min-height: auto !important;
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    gap: 16px !important;
    align-items: end !important;
    padding: 0 0 16px !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line) !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .dashboard-header span {
    color: var(--orange) !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-natural-v63 .dashboard-header h2 {
    margin: 2px 0 0 !important;
    color: var(--ink) !important;
    font-size: 30px !important;
    line-height: 1 !important;
   }

   .admin-body.admin-natural-v63 .dashboard-actions {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: flex-end !important;
    gap: 12px !important;
   }

   .admin-body.admin-natural-v63 .dashboard-actions button {
    min-height: 30px !important;
    padding: 0 !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line) !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--brand) !important;
    box-shadow: none !important;
    font-size: 12px !important;
    font-weight: 900 !important;
   }

   .admin-body.admin-natural-v63 .dashboard-actions .danger,
   .admin-body.admin-natural-v63 .dashboard-actions button.primary {
    color: var(--orange) !important;
    background: transparent !important;
   }

   .admin-body.admin-natural-v63 .admin-filter-panel {
    order: 1 !important;
    display: grid !important;
    grid-template-columns: 210px minmax(280px, 1fr) 220px 96px !important;
    gap: 14px !important;
    padding: 0 !important;
    background: transparent !important;
   }

   .admin-body.admin-natural-v63 .admin-filter-panel label,
   .admin-body.admin-natural-v63 .admin-filter-panel article,
   .admin-body.admin-natural-v63 .history-selector,
   .admin-body.admin-natural-v63 .vehicle-control-tools label {
    min-height: 50px !important;
    padding: 0 0 8px !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line) !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .admin-filter-panel span,
   .admin-body.admin-natural-v63 .history-selector span,
   .admin-body.admin-natural-v63 .vehicle-control-tools span,
   .admin-body.admin-natural-v63 .control-room-strip span,
   .admin-body.admin-natural-v63 .metrics span {
    color: var(--muted) !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-natural-v63 select,
   .admin-body.admin-natural-v63 input {
    color: var(--ink) !important;
    background: transparent !important;
    font-size: 13px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-natural-v63 .control-room-strip {
    order: 2 !important;
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 0 !important;
    padding: 14px 0 !important;
    border-top: 1px solid var(--line-soft) !important;
    border-bottom: 1px solid var(--line-soft) !important;
   }

   .admin-body.admin-natural-v63 .control-room-strip article {
    min-height: 74px !important;
    padding: 0 18px !important;
    border: 0 !important;
    border-right: 1px solid var(--line-soft) !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .control-room-strip article:last-child {
    border-right: 0 !important;
   }

   .admin-body.admin-natural-v63 .control-room-strip strong {
    margin-top: 7px !important;
    color: var(--ink) !important;
    font-size: 28px !important;
    line-height: 1 !important;
   }

   .admin-body.admin-natural-v63 .control-room-strip small {
    color: var(--muted) !important;
    font-size: 11px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-natural-v63 .site-overview-grid {
    order: 3 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 28px !important;
    padding: 0 !important;
   }

   .admin-body.admin-natural-v63 .site-overview-card {
    min-height: 310px !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .site-overview-head {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: 1fr auto !important;
    gap: 4px 16px !important;
    padding: 0 0 12px !important;
    border: 0 !important;
    border-bottom: 2px solid var(--brand) !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--ink) !important;
    text-align: left !important;
   }

   .admin-body.admin-natural-v63 .site-overview-card:nth-child(2) .site-overview-head {
    border-bottom-color: var(--orange) !important;
   }

   .admin-body.admin-natural-v63 .site-overview-head span {
    color: var(--soft-ink) !important;
    font-size: 13px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-natural-v63 .site-overview-head strong {
    grid-row: 1 / span 2 !important;
    color: var(--ink) !important;
    font-size: 38px !important;
    line-height: .9 !important;
   }

   .admin-body.admin-natural-v63 .site-overview-head small {
    color: var(--muted) !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-natural-v63 .site-vehicle-report-list {
    display: grid !important;
    gap: 0 !important;
    margin-top: 0 !important;
    max-height: 260px !important;
    overflow: auto !important;
    padding: 0 !important;
    border-bottom: 1px solid var(--line-soft) !important;
   }

   .admin-body.admin-natural-v63 .site-vehicle-report-row,
   .admin-body.admin-natural-v63 .vehicle-control-row,
   .admin-body.admin-natural-v63 .history-row,
   .admin-body.admin-natural-v63 .report-row,
   .admin-body.admin-natural-v63 .vehicle-summary article {
    min-height: 48px !important;
    padding: 9px 0 !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line-soft) !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--ink) !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .site-vehicle-report-row strong,
   .admin-body.admin-natural-v63 .vehicle-control-row strong,
   .admin-body.admin-natural-v63 .history-row strong,
   .admin-body.admin-natural-v63 .report-row strong,
   .admin-body.admin-natural-v63 .vehicle-summary strong {
    color: var(--ink) !important;
    font-size: 13px !important;
    line-height: 1.15 !important;
   }

   .admin-body.admin-natural-v63 .site-vehicle-report-row small,
   .admin-body.admin-natural-v63 .vehicle-control-row span,
   .admin-body.admin-natural-v63 .history-row span,
   .admin-body.admin-natural-v63 .report-row span,
   .admin-body.admin-natural-v63 .vehicle-summary span {
    color: var(--muted) !important;
    font-size: 10px !important;
    line-height: 1.2 !important;
   }

   .admin-body.admin-natural-v63 .site-vehicle-report-row em,
   .admin-body.admin-natural-v63 .vehicle-control-actions a,
   .admin-body.admin-natural-v63 .report-row a,
   .admin-body.admin-natural-v63 .history-row a {
    color: var(--brand) !important;
    font-size: 10px !important;
    font-style: normal !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-natural-v63 .metrics {
    order: 4 !important;
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 0 !important;
    padding: 14px 0 !important;
    border-top: 1px solid var(--line-soft) !important;
    border-bottom: 1px solid var(--line-soft) !important;
   }

   .admin-body.admin-natural-v63 .metrics article {
    min-height: 72px !important;
    padding: 0 18px !important;
    border: 0 !important;
    border-right: 1px solid var(--line-soft) !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
   }

   .admin-body.admin-natural-v63 .metrics article:last-child {
    border-right: 0 !important;
   }

   .admin-body.admin-natural-v63 .metrics article::before {
    display: none !important;
   }

   .admin-body.admin-natural-v63 .metrics strong {
    margin-top: 8px !important;
    color: var(--brand) !important;
    font-size: 30px !important;
    line-height: 1 !important;
   }

   .admin-body.admin-natural-v63 .dashboard-card-grid {
    order: 5 !important;
    display: grid !important;
    grid-template-columns: minmax(360px, .9fr) minmax(480px, 1.1fr) !important;
    gap: 28px !important;
    padding: 0 !important;
   }

   .admin-body.admin-natural-v63 .dashboard-widget {
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow: visible !important;
   }

   .admin-body.admin-natural-v63 .dashboard-widget > header {
    min-height: auto !important;
    padding: 0 0 10px !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line) !important;
    background: transparent !important;
   }

   .admin-body.admin-natural-v63 .dashboard-widget > header h3 {
    color: var(--ink) !important;
    font-size: 18px !important;
    line-height: 1.1 !important;
   }

   .admin-body.admin-natural-v63 .dashboard-widget > header span {
    color: var(--muted) !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
   }

   .admin-body.admin-natural-v63 .vehicle-control-tools,
   .admin-body.admin-natural-v63 .vehicle-control-summary,
   .admin-body.admin-natural-v63 .vehicle-summary,
   .admin-body.admin-natural-v63 .vehicle-history-list,
   .admin-body.admin-natural-v63 .report-list {
    padding: 12px 0 !important;
   }

   .admin-body.admin-natural-v63 .vehicle-control-tools {
    max-width: none !important;
    grid-template-columns: minmax(260px, 460px) !important;
   }

   .admin-body.admin-natural-v63 .vehicle-control-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 0 !important;
    border-bottom: 1px solid var(--line-soft) !important;
   }

   .admin-body.admin-natural-v63 .vehicle-control-summary article {
    min-height: 58px !important;
    padding: 0 14px 10px !important;
    border: 0 !important;
    border-right: 1px solid var(--line-soft) !important;
    border-radius: 0 !important;
    background: transparent !important;
   }

   .admin-body.admin-natural-v63 .vehicle-control-list,
   .admin-body.admin-natural-v63 .vehicle-history-list,
   .admin-body.admin-natural-v63 .report-list {
    gap: 0 !important;
    max-height: 440px !important;
    overflow: auto !important;
   }

   .admin-body.admin-natural-v63 .empty-state,
   .admin-body.admin-natural-v63 .empty-site-report {
    display: block !important;
    padding: 14px 0 !important;
    border: 0 !important;
    border-bottom: 1px solid var(--line-soft) !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--muted) !important;
    font-size: 12px !important;
    font-weight: 800 !important;
   }

   .admin-body.admin-natural-v63 .user-management-widget {
    grid-column: 1 / -1 !important;
   }

   .admin-body.admin-natural-v63 .user-row {
    min-height: 46px !important;
    padding: 8px 0 !important;
    border-bottom: 1px solid var(--line-soft) !important;
   }

   @media (max-width: 1120px) {
    .admin-body.admin-natural-v63 .admin-shell { grid-template-columns: 1fr !important; }
    .admin-body.admin-natural-v63 .fleet-sidebar { display: none !important; }
    .admin-body.admin-natural-v63 .fleet-topbar,
    .admin-body.admin-natural-v63 .dashboard-header,
    .admin-body.admin-natural-v63 .admin-filter-panel,
    .admin-body.admin-natural-v63 .control-room-strip,
    .admin-body.admin-natural-v63 .site-overview-grid,
    .admin-body.admin-natural-v63 .metrics,
    .admin-body.admin-natural-v63 .dashboard-card-grid {
     grid-template-columns: 1fr !important;
    }
   }\`;
}

function patchAdminJs(adminJs) {`,
  "admin natural css helper"
);

await fs.mkdir(path.dirname(generatedPath), { recursive: true });
await fs.writeFile(generatedPath, source);
await import(pathToFileURL(generatedPath).href);
