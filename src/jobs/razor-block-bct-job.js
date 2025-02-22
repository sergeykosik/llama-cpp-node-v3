import { postMessage } from '../helpers/api.js';
import { JobBase } from './job-base.js';

export class RazorBlockBctJob extends JobBase {
    constructor(config = {}) {
      super(config);
      this.sectionName = config.sectionName || 'bct';
      this.regex = new RegExp(`@section\\s+${this.sectionName}\\s*{([\\s\\S]*?)}`, 'g');
    }
  
    async process(content, filePath) {
      const matches = content.match(this.regex);
      console.log(`Found ${matches?.length || 0} blocks in ${filePath}`);
      if (!matches) {
        return { modified: false };
      }
  
      let modifiedContent = content;
      for (const block of matches) {
        console.log('Block:', block);
        const prompt = `Convert this Razor HTML to SDS Web Component: ${block}`;
        
        const response = await postMessage(prompt/* , this.systemPrompt */);
        if (response?.response) {
          modifiedContent = modifiedContent.replace(block, response.response);
        }
      }
  
      return {
        modified: modifiedContent !== content,
        content: modifiedContent
      };
    }
  }
