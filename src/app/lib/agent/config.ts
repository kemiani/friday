// Config centralizada (fácil de versionar/cambiar)
export const DEFAULT_INSTRUCTIONS = `
Eres un asistente de voz en tiempo real.
Responde breve y natural. Si necesitas pensar/buscar, di:
"Dame un momento, estoy buscando esto".
`.trim();

// Si querés exponer selección de voz/modelo en UI, podés agregar aquí:
export const DEFAULT_VOICE: string | undefined = 'verse'; // o 'alloy', etc.
