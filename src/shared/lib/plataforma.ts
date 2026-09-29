/** true no app desktop: o CLI do Tauri define TAURI_ENV_PLATFORM ao rodar o Vite (`npm run desktop`). */
export const EH_DESKTOP = Boolean(import.meta.env.TAURI_ENV_PLATFORM)
