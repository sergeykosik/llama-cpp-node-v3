import { fileURLToPath } from 'url';
import path from 'path';
import { FileWalker } from './filewalker.js';
import { RazorBlockBctJob } from './jobs/razor-block-bct-job.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const directoryPath = path.resolve(__dirname, '../files');

async function main() {
  const walker = new FileWalker({
    fileExtensions: ['.cshtml'],
    excludeDirs: ['node_modules', 'dist', 'bin', 'obj'],
    fileNameFilter: /TaxesReport\.cshtml$/i  // Process only Layout.cshtml files
  });

  const job = new RazorBlockBctJob({
    sectionName: 'bct'
  });

  await walker.walk(directoryPath, job);
}

main().catch(console.error);
