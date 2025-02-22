import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

function resolveDirectoryPath() {
    const __filename = fileURLToPath(import.meta.url);
    return path.resolve(path.dirname(__filename), '../../files');
  }

/**
 * Finds Razor blocks in files within a directory
 * @param {string} directoryPath - Path to search for Razor blocks
 * @param {SearchOptions} [options={}] - Search configuration
 * @returns {Promise<RazorBlockResult[]>} Array of Razor block search results
 */
async function findRazorBlocks(
  directoryPath, 
  options = {}
) {
  const {
    fileExtensions = ['.cshtml'], 
    sectionName = 'bct'
  } = options;

  // Construct regex dynamically based on section name
  const razorBlockRegex = new RegExp(`@section\\s+${sectionName}\\s*{[\\s\\S]*?}`, 'g');
  const results = [];

  try {
    const files = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(directoryPath, file.name);

      if (file.isDirectory()) continue;

      if (fileExtensions.includes(path.extname(file.name))) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const matches = content.match(razorBlockRegex);

          if (matches) {
            results.push({
              filename: file.name,
              blocks: matches
            });
          }
        } catch (readError) {
          console.error(`Error reading file ${file.name}:`, readError);
        }
      }
    }
  } catch (error) {
    console.error('Directory processing error:', error);
  }

  return results;
}

// Example usage
async function main() {
  const directoryPath = resolveDirectoryPath();
  const searchResults = await findRazorBlocks(directoryPath);
  
  searchResults.forEach(result => {
    console.log(`Blocks in ${result.filename}:`);
    result.blocks.forEach((block, index) => {
      console.log(`Block ${index + 1}:`, block);
    });
  });
}

main();
