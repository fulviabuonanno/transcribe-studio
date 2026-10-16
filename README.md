# Transcribe Studio

MVP de transcripción local con React, Vite y Whisper (Transformers.js).

## Ejecutar

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
```

Carga archivos de audio compatibles con el navegador, elige el idioma, transcribe y exporta a TXT o Markdown. El modelo se descarga desde Hugging Face la primera vez. El audio se procesa en el dispositivo. Las grabaciones largas pueden agotar la memoria del navegador.
