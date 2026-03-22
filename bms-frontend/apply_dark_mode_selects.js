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
  
  // We want to find <select ... > tags and inside them, append to className="..."
  // We can do this safely by matching <select[^>]+className="([^"]+)"[^>]*> or similar.
  // Actually, since React classNames are always className="...", we can just regex search `<select[\s\S]*?>` and then modify it.
  
  content = content.replace(/<select\b([^>]*)>/g, (match, inside) => {
    // If it doesn't have a className, add one
    if (!inside.includes('className=')) {
      return `<select ${inside} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">`;
    }
    
    // If it has className=", inject our dark classes safely if not present
    return `<select` + inside.replace(/className="([^"]*)"/, (clsMatch, clsValue) => {
      let newCls = clsValue;
      if (!newCls.includes('dark:bg-slate-800') && !newCls.includes('dark:bg-slate-900')) {
        newCls += ' dark:bg-slate-800';
      }
      if (!newCls.includes('dark:border-slate-700') && !newCls.includes('dark:border-slate-600')) {
        newCls += ' dark:border-slate-700';
      }
      if (!newCls.includes('dark:text-white') && !newCls.includes('dark:text-slate-200')) {
        newCls += ' dark:text-white';
      }
      return `className="${newCls}"`;
    }) + `>`;
  });
  
  // Clean up any weird double spaces we might have caused
  content = content.replace(/className="([^"]+)\s+"/g, 'className="$1"');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedFiles);
