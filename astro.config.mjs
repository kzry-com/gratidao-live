// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';

const projectDir = fileURLToPath(new URL('.', import.meta.url));

/** @returns {import('vite').Plugin} */
function safeWatcherPlugin() {
  return {
    name: 'safe-watcher',
    configureServer(server) {
      server.watcher.on('error', (err) => {
        // Ignora erros de pastas restritas/sistema do Windows como E:\Config.Msi (EINVAL / EPERM)
        const code = /** @type {any} */ (err)?.code;
        if (code === 'EINVAL' || code === 'EPERM' || code === 'EACCES') {
          return;
        }
        console.warn('[vite watcher]', err);
      });

      // Monitora alterações em public/data (feitas pelo Admin Desktop ou Web) para atualizar o catálogo instantaneamente
      const dataDir = path.resolve(projectDir, 'public/data');
      server.watcher.add(dataDir);
      server.watcher.on('all', (event, filePath) => {
        if (filePath.includes('public/data') || filePath.includes('public\\data')) {
          console.log(`[Vite Watcher] Alteração detectada no catálogo (${event}): ${path.basename(filePath)} -> Invalidando cache do Vite`);
          server.moduleGraph.invalidateAll();
          server.ws.send({ type: 'full-reload' });
        }
      });
    }
  };
}

/** @returns {import('vite').Plugin} */
function adminReleasePlugin() {
  return {
    name: 'admin-release-middleware',
    configureServer(server) {
      server.middlewares.use('/api/admin/release', async (req, res, next) => {
        // Headers de CORS para permitir requisições do app admin (localhost:8081)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          try {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const bodyStr = Buffer.concat(chunks).toString('utf-8');
            const data = JSON.parse(bodyStr);

            const targetDir = data.targetPath || path.resolve(projectDir, 'public/data');
            const files = data.arquivosJson || {};

            await fs.mkdir(targetDir, { recursive: true });

            for (const [filename, content] of Object.entries(files)) {
              const filePath = path.join(targetDir, filename);
              await fs.writeFile(filePath, content, 'utf-8');
            }

            console.log(`[AdminRelease] Gravados ${Object.keys(files).length} arquivos em ${targetDir}`);

            // Força a invalidação completa de módulos no Vite e recarrega o navegador conectado
            server.moduleGraph.invalidateAll();
            server.ws.send({ type: 'full-reload' });

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              message: 'Arquivos gravados com sucesso na pasta de release!',
              files: Object.keys(files),
              targetDir
            }));
          } catch (err) {
            console.error('[AdminRelease Error]', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        next();
      });
    }
  };
}

// https://astro.build/config
export default defineConfig({
  root: projectDir,
  integrations: [react(), icon()],

  vite: {
    root: projectDir,
    plugins: [tailwindcss(), safeWatcherPlugin(), adminReleasePlugin()],
    server: {
      fs: {
        strict: true,
        allow: [projectDir]
      },
      watch: {
        cwd: projectDir,
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.git/**'
        ]
      }
    }
  }
});
