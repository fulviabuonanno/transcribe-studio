import { pipeline, env } from '@huggingface/transformers';
env.allowLocalModels = false;
let transcriber: any;
self.onmessage = async (event: MessageEvent<{ audio: Float32Array; language: string }>) => {
  try {
    self.postMessage({ type: 'status', message: 'Descargando o cargando Whisper…' });
    transcriber ??= await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', { dtype: 'q8', device: 'wasm' });
    self.postMessage({ type: 'status', message: 'Transcribiendo…' });
    const result = await transcriber(event.data.audio, { language: event.data.language === 'auto' ? undefined : event.data.language, task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });
    self.postMessage({ type: 'result', text: result.text ?? '' });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
