const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir('./src');

// Function to safely apply a replacement if it doesn't already exist
function safeReplace(str, searchRegex, addition) {
  return str.replace(searchRegex, (match) => {
    // If the match string already contains the addition, return it as-is
    if (match.includes(addition)) return match;
    // Otherwise add the addition
    return match + ' ' + addition;
  });
}

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Specific replacements using safe string insertions
  content = safeReplace(content, /\bbg-white\b(?!\s+dark:bg-)/g, 'dark:bg-slate-800');
  content = safeReplace(content, /\bbg-slate-50\b(?!\s+dark:bg-)/g, 'dark:bg-slate-900');
  content = safeReplace(content, /\bbg-gray-50\b(?!\s+dark:bg-)/g, 'dark:bg-slate-900');
  
  content = safeReplace(content, /\btext-slate-900\b(?!\s+dark:text-)/g, 'dark:text-white');
  content = safeReplace(content, /\btext-gray-900\b(?!\s+dark:text-)/g, 'dark:text-gray-100');
  
  content = safeReplace(content, /\btext-slate-800\b(?!\s+dark:text-)/g, 'dark:text-slate-200');
  content = safeReplace(content, /\btext-gray-800\b(?!\s+dark:text-)/g, 'dark:text-gray-200');
  
  content = safeReplace(content, /\btext-slate-700\b(?!\s+dark:text-)/g, 'dark:text-slate-300');
  content = safeReplace(content, /\btext-gray-700\b(?!\s+dark:text-)/g, 'dark:text-gray-300');
  
  content = safeReplace(content, /\btext-slate-600\b(?!\s+dark:text-)/g, 'dark:text-slate-400');
  content = safeReplace(content, /\btext-gray-600\b(?!\s+dark:text-)/g, 'dark:text-gray-400');
  
  content = safeReplace(content, /\btext-slate-500\b(?!\s+dark:text-)/g, 'dark:text-slate-400');
  content = safeReplace(content, /\btext-gray-500\b(?!\s+dark:text-)/g, 'dark:text-gray-400');
  
  content = safeReplace(content, /\bborder-slate-200\b(?!\s+dark:border-)/g, 'dark:border-slate-700');
  content = safeReplace(content, /\bborder-gray-200\b(?!\s+dark:border-)/g, 'dark:border-slate-700');
  content = safeReplace(content, /\bborder-slate-100\b(?!\s+dark:border-)/g, 'dark:border-slate-800');
  content = safeReplace(content, /\bborder-gray-100\b(?!\s+dark:border-)/g, 'dark:border-slate-800');
  
  content = safeReplace(content, /\bdivide-slate-200\b(?!\s+dark:divide-)/g, 'dark:divide-slate-700');
  content = safeReplace(content, /\bdivide-gray-200\b(?!\s+dark:divide-)/g, 'dark:divide-slate-700');
  
  // Specific input classes that are missing dark mode equivalents
  content = content.replace(/className="w-full p-2 border rounded"/g, 'className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"');
  
  // Input fields with mt-1 block w-full
  content = content.replace(/mt-1 block w-full rounded-md border-gray-200 shadow-sm/g, 'mt-1 block w-full rounded-md border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedFiles);
