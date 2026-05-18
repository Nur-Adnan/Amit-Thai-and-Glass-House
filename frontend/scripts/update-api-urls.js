#!/usr/bin/env node

/**
 * Script to update hardcoded API URLs in frontend components
 * This helps migrate from hardcoded localhost URLs to environment variables
 */

const fs = require('fs');
const path = require('path');

const HARDCODED_URL = 'http://localhost:3001';
const REPLACEMENT = "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'";

// Files to update (add more as needed)
const filesToUpdate = [
  'src/components/InvoiceDisplay.tsx',
  'src/components/TrustInfoManager.tsx',
  'src/components/BusinessSummaryCards.tsx',
  'src/components/DailySummary.tsx',
  'src/components/FinancialWarnings.tsx',
  // Add more files here
];

function updateFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Replace hardcoded URLs
    content = content.replace(
      new RegExp(`'${HARDCODED_URL}`, 'g'),
      `\`\${${REPLACEMENT}}`
    );

    content = content.replace(
      new RegExp(`"${HARDCODED_URL}`, 'g'),
      `\`\${${REPLACEMENT}}`
    );

    // Replace template literals that might already exist
    content = content.replace(
      new RegExp(`\`${HARDCODED_URL}`, 'g'),
      `\`\${${REPLACEMENT}}`
    );

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔄 Updating hardcoded API URLs...\n');

  filesToUpdate.forEach(updateFile);

  console.log('\n🎉 API URL update completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Review the changes in each file');
  console.log('2. Test the application with different environments');
  console.log('3. Update any remaining hardcoded URLs manually');
  console.log('\n💡 Tip: Use the new api utility from src/lib/api.ts for new API calls');
}

if (require.main === module) {
  main();
}

module.exports = { updateFile };