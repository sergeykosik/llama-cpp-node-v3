import fs from 'fs/promises';
import path from 'path';

export class FileWalker {
  constructor(options = {}) {
    this.fileExtensions = options.fileExtensions || ['.cshtml'];
    this.excludeDirs = options.excludeDirs || ['node_modules', 'dist'];
    this.fileNameFilter = options.fileNameFilter;
  }

  async walk(directoryPath, jobHandler) {
    try {
      const files = await fs.readdir(directoryPath, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(directoryPath, file.name);

        if (file.isDirectory()) {
          if (!this.excludeDirs.includes(file.name)) {
            await this.walk(fullPath, jobHandler);
          }
          continue;
        }

        if (this.shouldProcessFile(file.name)) {
            await this.processFile(fullPath, jobHandler);
          }
      }
    } catch (error) {
      console.error(`Error walking directory ${directoryPath}:`, error);
    }
  }

  shouldProcessFile(fileName) {
    const hasValidExtension = this.fileExtensions.includes(path.extname(fileName));
    const matchesFilter = !this.fileNameFilter || fileName.match(this.fileNameFilter);
    return hasValidExtension && matchesFilter;
  }























































  
  async processFile(filePath, jobHandler) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const result = await jobHandler.process(content, filePath);
      
      if (result.modified) {
        await fs.writeFile(filePath, result.content, 'utf8');
        console.log(`✔️ Updated ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }
}
