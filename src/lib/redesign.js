const fs = require('fs');
const path = require('path');

const filesToRedesign = [
  'src/app/page.tsx',
  'src/app/opportunities/page.tsx',
  'src/app/agent/page.tsx',
  'src/app/simulator/page.tsx',
  'src/app/activity/page.tsx',
  'src/app/recommendations/[id]/page.tsx'
];

const basePath = path.join(__dirname, '..', '..');

filesToRedesign.forEach(fileRelPath => {
  const filePath = path.join(basePath, fileRelPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${fileRelPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace all slate references with zinc references
  content = content.replace(/slate-/g, 'zinc-');

  // 2. Replace indigo/violet colors with custom grayscale components
  content = content.replace(/bg-indigo-600/g, 'bg-zinc-800 border border-zinc-700');
  content = content.replace(/hover:bg-indigo-500/g, 'hover:bg-zinc-700 hover:text-white');
  content = content.replace(/bg-indigo-500/g, 'bg-zinc-600');
  content = content.replace(/text-indigo-400/g, 'text-zinc-300');
  content = content.replace(/text-indigo-300/g, 'text-zinc-200');
  content = content.replace(/border-indigo-900\/60/g, 'border-zinc-800');
  content = content.replace(/bg-indigo-500\/10/g, 'bg-zinc-800/40');
  content = content.replace(/text-violet-400/g, 'text-zinc-300');
  content = content.replace(/text-violet-500/g, 'text-zinc-400');
  content = content.replace(/bg-violet-500\/10/g, 'bg-zinc-800');
  content = content.replace(/border-violet-500\/20/g, 'border-zinc-700');
  content = content.replace(/border-violet-500\/25/g, 'border-zinc-700');
  content = content.replace(/accent-indigo-500/g, 'accent-zinc-400');
  content = content.replace(/shadow-indigo-600\/10/g, 'shadow-zinc-950/20');
  content = content.replace(/shadow-indigo-600\/20/g, 'shadow-zinc-950/20');
  content = content.replace(/border-l-4 border-indigo-500/g, 'border-l-2 border-zinc-400');
  content = content.replace(/fill-indigo-500/g, 'fill-zinc-500');

  // 3. Page specific adjustments
  if (fileRelPath === 'src/app/page.tsx') {
    // Grayscale colors for Recharts
    content = content.replace(/primary: '#6366f1'/g, "primary: '#71717a'"); // Slate gray for GMV line
    content = content.replace(/purple: '#8b5cf6'/g, "purple: '#d4d4d8'");   // Silver/light gray for success rates
    content = content.replace(/UPI: '#8b5cf6'/g, "UPI: '#52525b'");         // Graphite color for UPI bar
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully redesigned: ${fileRelPath}`);
});

console.log('🎉 Redesign script completed!');
