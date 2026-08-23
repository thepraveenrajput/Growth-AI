const fs = require('fs');
const path = require('path');

const filesToRedesign = [
  'src/app/layout.tsx',
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

  // 1. Layout Brand & Badge Redesign
  if (fileRelPath === 'src/app/layout.tsx') {
    // Brand Logo metallic-amber gradient
    content = content.replace(/from-white to-zinc-400/g, 'from-white via-zinc-200 to-amber-500/80');
    // Copilot Badge
    content = content.replace(/bg-zinc-800 text-zinc-300 border border-zinc-700/g, 'bg-amber-500/5 text-amber-400 border border-amber-500/20');
    // Navigation links slide-in indicators in amber
    content = content.replace(
      /className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"/g,
      'className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900 pl-2.5 transition-all duration-150"'
    );
  }

  // 2. Dashboard Card & Charts Accent updates
  if (fileRelPath === 'src/app/page.tsx') {
    // Recharts primary line = warm amber gold, secondary = silver-zinc
    content = content.replace(/primary: '#71717a'/g, "primary: '#f59e0b'"); 
    content = content.replace(/purple: '#d4d4d8'/g, "purple: '#e4e4e7'");
    // Card highlights
    content = content.replace(
      /border border-zinc-900\/60 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group/g,
      'border border-amber-500/10 bg-amber-500/[0.02] rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group'
    );
    content = content.replace(/text-zinc-300">Revenue Opportunity<\/span>/g, 'text-amber-400">Revenue Opportunity<\/span>');
    content = content.replace(/text-zinc-300 font-bold mt-2 hover:text-zinc-200/g, 'text-amber-500 hover:text-amber-400 font-semibold hover:underline mt-2');
  }

  // 3. AI Agent view
  if (fileRelPath === 'src/app/agent/page.tsx') {
    // Observability trace terminal header accent
    content = content.replace(/text-violet-400/g, 'text-amber-400');
    // Glowing agentic badge
    content = content.replace(
      /bg-zinc-800 text-zinc-300 border border-zinc-700/g,
      'bg-amber-500/5 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
    );
    // Left border indicator in recommendation cards
    content = content.replace(/border-l-2 border-zinc-400/g, 'border-l-2 border-amber-500');
    // Button hovers
    content = content.replace(/bg-zinc-600/g, 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700');
    content = content.replace(/bg-zinc-800 border border-zinc-700/g, 'bg-zinc-900 hover:border-amber-500/40 text-zinc-100 transition-colors');
    content = content.replace(/bg-zinc-600/g, 'bg-zinc-800 hover:bg-zinc-700');
  }

  // 4. Opportunities view
  if (fileRelPath === 'src/app/opportunities/page.tsx') {
    // Actions button
    content = content.replace(/bg-zinc-600/g, 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700');
    content = content.replace(/text-zinc-300/g, 'text-zinc-200');
  }

  // 5. Simulator view
  if (fileRelPath === 'src/app/simulator/page.tsx') {
    // Target opportunity card gradient border
    content = content.replace(
      /border border-zinc-900\/60 rounded-xl p-6 shadow-lg/g,
      'border border-amber-500/10 bg-amber-500/[0.01] rounded-xl p-6 shadow-lg'
    );
    content = content.replace(/text-zinc-300 uppercase/g, 'text-amber-400 uppercase');
    content = content.replace(/text-zinc-400 font-bold/g, 'text-amber-500 font-bold');
    content = content.replace(/accent-zinc-400/g, 'accent-amber-500');
  }

  // 6. Recommendation Detail page
  if (fileRelPath === 'src/app/recommendations/[id]/page.tsx') {
    // Impact card border and text
    content = content.replace(
      /border border-zinc-800 rounded-xl p-6 shadow-lg space-y-6/g,
      'border border-amber-500/10 bg-amber-500/[0.01] rounded-xl p-6 shadow-lg space-y-6'
    );
    content = content.replace(/text-zinc-500 uppercase tracking-widest/g, 'text-amber-400 uppercase tracking-widest');
    content = content.replace(/bg-zinc-600/g, 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated accent colors for: ${fileRelPath}`);
});

console.log('🎉 Grayscale + Gold redesign complete!');
