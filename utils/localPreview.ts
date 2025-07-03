import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as net from 'net';

async function findOpenPort(start = 4000, end = 4100): Promise<number> {
  function checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port, '0.0.0.0');
    });
  }
  for (let p = start; p <= end; p++) {
    if (await checkPort(p)) return p;
  }
  throw new Error('No open port found in range');
}

export interface PreviewHandle {
  url: string;
  stop: () => void;
}

/**
 * Starts a local dev server (npm run dev) inside the given repoPath.
 * Streams stdout/stderr via onLog callback and resolves when the server reports it is ready.
 */
export async function startLocalPreview(
  repoPath: string,
  onLog: (chunk: string) => void = () => {}
): Promise<PreviewHandle> {
  const port = await findOpenPort();

  // Ensure dependencies are installed
  await new Promise<void>((resolve, reject) => {
    const install = spawn('npm', ['install', '--ignore-scripts'], {
      cwd: repoPath,
      shell: true
    });
    install.stdout.on('data', (d) => onLog(d.toString()));
    install.stderr.on('data', (d) => onLog(d.toString()));
    install.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with ${code}`));
    });
  });

  const devProc: ChildProcessWithoutNullStreams = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: repoPath,
    shell: true
  });

  devProc.stdout.on('data', (d) => onLog(d.toString()));
  devProc.stderr.on('data', (d) => onLog(d.toString()));

  await new Promise<void>((resolve) => {
    const listener = (data: Buffer) => {
      const txt = data.toString();
      if (txt.toLowerCase().includes('ready') || txt.includes(`localhost:${port}`)) {
        devProc.stdout.off('data', listener);
        resolve();
      }
    };
    devProc.stdout.on('data', listener);
  });

  return {
    url: `http://localhost:${port}`,
    stop: () => {
      if (!devProc.killed) devProc.kill('SIGTERM');
    }
  };
} 