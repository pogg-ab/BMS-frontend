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
    if (match.includes(addition)) return match;
    return match + ' ' + addition;
  });
}

function fullReplace(str, search, replacement) {
  return str.split(search).join(replacement);
}

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Specific replacements
  // Status badges: bg-slate-100 -> dark:bg-slate-800
  content = safeReplace(content, /\bbg-slate-100\b(?!\s+dark:bg-)/g, 'dark:bg-slate-800');
  
  // divide-slate-100 -> dark:divide-slate-700/50
  content = safeReplace(content, /\bdivide-slate-100\b(?!\s+dark:divide-)/g, 'dark:divide-slate-700/50');
  
  // Buttons with blue accents
  content = safeReplace(content, /\bborder-blue-200\b(?!\s+dark:border-)/g, 'dark:border-blue-800/50');
  content = safeReplace(content, /\bhover:bg-blue-50\b(?!\s+dark:hover:bg-)/g, 'dark:hover:bg-blue-900/30');
  content = safeReplace(content, /\btext-blue-600\b(?!\s+dark:text-)/g, 'dark:text-blue-400');
  
  // Buttons with indigo accents
  content = safeReplace(content, /\bborder-indigo-200\b(?!\s+dark:border-)/g, 'dark:border-indigo-800/50');
  content = safeReplace(content, /\bhover:bg-indigo-50\b(?!\s+dark:hover:bg-)/g, 'dark:hover:bg-indigo-900/30');
  content = safeReplace(content, /\btext-indigo-600\b(?!\s+dark:text-)/g, 'dark:text-indigo-400');

  // Any left-over text-gray-500 in headers that look muddy
  content = safeReplace(content, /\btext-gray-500\b(?!\s+dark:text-)/g, 'dark:text-gray-400');
  
  // Action text buttons like "Delete"
  content = safeReplace(content, /\btext-red-600\b(?!\s+dark:text-)/g, 'dark:text-red-400');
  content = safeReplace(content, /\btext-red-700\b(?!\s+dark:text-)/g, 'dark:text-red-400');
  
  // Table rows hover backgrounds inside tbody
  // Usually hover:bg-gray-50 or hover:bg-slate-50
  // Handled by previous script but let's be sure
  content = safeReplace(content, /\bhover:bg-slate-50\b(?!\s+dark:bg-)/g, 'dark:hover:bg-slate-800/50');
  content = safeReplace(content, /\bhover:bg-gray-50\b(?!\s+dark:bg-)/g, 'dark:hover:bg-slate-800/50');
  
  // Table Headers
  content = safeReplace(content, /\bbg-slate-50\b(?!\s+dark:bg-)/g, 'dark:bg-slate-800');
  content = safeReplace(content, /\bbg-gray-50\b(?!\s+dark:bg-)/g, 'dark:bg-slate-800');

  // Tbody that needs text color explicitly set
  // This is rarely needed as text color is inherited, but just in case
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedFiles);
