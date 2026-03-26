const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          results = results.concat(walkDir(fullPath));
        }
      } else {
        if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
          results.push(fullPath);
        }
      }
    });
  } catch (err) {
    console.error('Error walking dir:', dir, err.message);
  }
  return results;
}

const files = walkDir('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Safe replacement for className in form tags (input, select, textarea)
  // This avoids breaking arrow functions by ensuring we handle the "=>" inside tags
  content = content.replace(/<(input|select|textarea)\b((?:[^>]*|=>)*?)\s*\/?>/g, (tagMatch, tagName, attributes) => {
    const classNameRegex = /className=(["'])([\s\S]*?)\1/;
    const classNameMatch = attributes.match(classNameRegex);
    
    if (classNameMatch) {
      let classList = classNameMatch[2];
      const quote = classNameMatch[1];
      
      let updated = false;
      // Define common dark mode additions for inputs
      const additions = ['dark:bg-slate-800', 'dark:border-slate-700', 'dark:text-white'];
      
      additions.forEach(cls => {
        if (!classList.includes(cls)) {
          classList += ' ' + cls;
          updated = true;
        }
      });
      
      if (updated) {
        const newAttributes = attributes.replace(classNameRegex, `className=${quote}${classList.trim()}${quote}`);
        // Return updated tag (keeping the original closing part /> if present)
        const isSelfClosing = tagMatch.endsWith('/>');
        return `<${tagName}${newAttributes}${isSelfClosing ? ' /' : ''}>`;
      }
    }
    return tagMatch;
  });

  // 2. Global but specific replacements for common layout/table classes
  // These are less likely to break code as they are very specific Tailwind patterns
  const globalFixes = [
    { search: /\bbg-white\b(?!\s+dark:bg-)/g, add: 'dark:bg-slate-800' },
    { search: /\bbg-slate-50\b(?!\s+dark:bg-)/g, add: 'dark:bg-slate-900' },
    { search: /\bbg-gray-50\b(?!\s+dark:bg-)/g, add: 'dark:bg-slate-900' },
    { search: /\btext-slate-900\b(?!\s+dark:text-)/g, add: 'dark:text-white' },
    { search: /\btext-slate-800\b(?!\s+dark:text-)/g, add: 'dark:text-slate-200' },
    { search: /\bborder-slate-200\b(?!\s+dark:border-)/g, add: 'dark:border-slate-700' },
    { search: /\bdivide-slate-100\b(?!\s+dark:divide-)/g, add: 'dark:divide-slate-700/50' },
    { search: /\bhover:bg-slate-50\b(?!\s+dark:hover:bg-)/g, add: 'dark:hover:bg-slate-800/50' }
  ];

  globalFixes.forEach(fix => {
    content = content.replace(fix.search, (match) => {
      if (match.includes(fix.add)) return match;
      return match + ' ' + fix.add;
    });
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedFiles);
