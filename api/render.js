Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
export default function handler(_req, res) {
  res.status(501).json({ error: 'Renderização MP4 exige o worker local com FFmpeg. A versão hospedada usa renderização WebM no navegador.', code: 'LOCAL_FFMPEG_REQUIRED' });
}


