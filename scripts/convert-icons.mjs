import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

async function convertSvgToPng() {
  try {
    // Converter 192x192
    await sharp(path.join(publicDir, 'coruja-pwa-192.svg'))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'coruja-pwa-192.png'));
    
    console.log('✓ coruja-pwa-192.png criado');

    // Converter 512x512
    await sharp(path.join(publicDir, 'coruja-pwa-512.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'coruja-pwa-512.png'));
    
    console.log('✓ coruja-pwa-512.png criado');

    console.log('\n✅ Ícones PWA convertidos com sucesso!');
  } catch (error) {
    console.error('Erro ao converter SVGs:', error);
    process.exit(1);
  }
}

convertSvgToPng();
