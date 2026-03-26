
const testContent = `
<select value={selected} onChange={e => setSelected(e.target.value)} className="form-select">
<input type="text" className="w-full p-2 border rounded" />
<textarea className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
`;

const tagName = 'select';
const attributes = ' value={selected} onChange={e => setSelected(e.target.value)} className="form-select"';

const classNameRegex = /className=(["'])([\s\S]*?)\1/;
const classNameMatch = attributes.match(classNameRegex);
console.log('Match:', classNameMatch);

if (classNameMatch) {
    let classList = classNameMatch[2];
    const quote = classNameMatch[1];
    console.log('ClassList:', classList);
    classList += ' dark:bg-slate-800 dark:border-slate-700 dark:text-white';
    const newAttributes = attributes.replace(classNameRegex, `className=${quote}${classList}${quote}`);
    console.log('New Attributes:', newAttributes);
}
