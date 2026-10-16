import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

async function decodeAudio(file: File): Promise<Float32Array> {
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    const length = Math.ceil(buffer.duration * 16000);
    const offline = new OfflineAudioContext(1, length, 16000);
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start();
    return (await offline.startRendering()).getChannelData(0).slice();
  } finally { await context.close(); }
}
function App() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('spanish');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const worker = useRef<Worker | null>(null);
  useEffect(() => {
    const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = ({ data }) => {
      if (data.type === 'status') setStatus(data.message);
      if (data.type === 'result') { setText(data.text); setStatus('Transcripción completada'); setBusy(false); }
      if (data.type === 'error') { setStatus('Error: ' + data.message); setBusy(false); }
    };
    return () => { w.terminate(); worker.current = null; };
  }, []);
  async function transcribe() {
    if (!file || !worker.current) return;
    setBusy(true); setStatus('Preparando audio…');
    try { const audio = await decodeAudio(file); worker.current.postMessage({ audio, language }, [audio.buffer]); }
    catch (error) { setStatus('No se pudo leer el audio: ' + String(error)); setBusy(false); }
  }
  function download(extension: 'txt' | 'md') {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transcripcion.' + extension; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main><header><span className="eyebrow">AI AUDIO WORKSPACE</span><h1>Transcribe Studio<span className="accent">.</span></h1><p>Convierte voz en texto con Whisper, directamente en tu navegador.</p></header>
    <section className="panel"><label className="drop"><input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm" onChange={e => { setFile(e.target.files?.[0] ?? null); setText(''); setStatus(''); }} /><span className="upload">↑</span><strong>{file ? file.name : 'Selecciona un archivo de audio'}</strong><small>MP3, WAV, M4A y otros formatos compatibles con tu navegador</small></label>
      <div className="actions"><label>Idioma <select value={language} onChange={e => setLanguage(e.target.value)}><option value="spanish">Español</option><option value="english">Inglés</option><option value="italian">Italiano</option><option value="auto">Detección automática</option></select></label><button disabled={!file || busy} onClick={transcribe}>{busy ? 'Procesando…' : 'Transcribir audio →'}</button></div>
      {status && <p role="status" className="status">{status}</p>}
    </section><section className="panel"><div className="section-title"><h2>Transcripción</h2><div className="exports"><button className="secondary" disabled={!text} onClick={() => download('txt')}>TXT ↓</button><button className="secondary" disabled={!text} onClick={() => download('md')}>MD ↓</button></div></div><textarea aria-label="Texto transcrito editable" placeholder="Tu transcripción aparecerá aquí. Podrás editarla antes de descargarla." value={text} onChange={e => setText(e.target.value)} rows={12}/></section><footer>Privacidad primero · Procesamiento local · Sin API de pago</footer></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
