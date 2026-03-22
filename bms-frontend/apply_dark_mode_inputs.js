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

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Find all <input ... className="..."> or <textarea ...> or <select ...>
  // and inject dark:bg-slate-800 dark:text-white if not present
  
  const tags = ['input', 'select', 'textarea'];
  
  tags.forEach(tag => {
    // A bit manual but safe: we look for className="..." within tags.
    // We can just globally add to any className that looks like it belongs to a form element by checking its content.
    // Instead, I'll use a direct string replacements for the known patterns from the grep.
    
    content = content.replace(/className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"/g, 'className="mt-1 block w-full rounded-md border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm"');
    
    content = content.replace(/className="mt-1 block w-full rounded-md border-gray-200 dark:border-slate-700 shadow-sm"/g, 'className="mt-1 block w-full rounded-md border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm"');
    
    content = content.replace(/className="w-full p-2 border rounded"/g, 'className="w-full p-2 border rounded dark:border-slate-700 dark:bg-slate-800 dark:text-white"');
    
    content = content.replace(/className="w-full p-2 border rounded dark:border-slate-700"/g, 'className="w-full p-2 border rounded dark:border-slate-700 dark:bg-slate-800 dark:text-white"');
    
    // Some buttons with bg-white without dark mode:
    content = content.replace(/className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"/g, 'className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"');
    
    content = content.replace(/className="px-3 py-2 bg-white border rounded hover:bg-gray-50"/g, 'className="px-3 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-700"');
    
    content = content.replace(/className="px-3 py-2 bg-white border rounded"/g, 'className="px-3 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded"');
    
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedFiles);
