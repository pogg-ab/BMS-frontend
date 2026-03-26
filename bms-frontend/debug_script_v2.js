
const testContent = `
<select value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm">
<input type="text" className="w-full p-2 border rounded" />
<textarea className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
`;

// New regex that handles =>
const tagRegex = /<(input|select|textarea)\b((?:[^>]*|=>)*)>/g;

let match;
while ((match = tagRegex.exec(testContent)) !== null) {
    const tagName = match[1];
    const attributes = match[2];
    console.log('Tag:', tagName);
    console.log('Attributes:', attributes);
    
    const classNameRegex = /className=(["'])([\s\S]*?)\1/;
    const classNameMatch = attributes.match(classNameRegex);
    if (classNameMatch) {
        console.log('Found ClassList:', classNameMatch[2]);
    }
}
