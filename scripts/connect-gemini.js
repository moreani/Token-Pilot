import { fetchAllAntigravityAccountsTelemetry } from '../packages/quota/dist/antigravityCollector.js';

async function main() {
  console.log('====================================================');
  console.log('   TokenPilot: Antigravity Local Identity Linker    ');
  console.log('====================================================');
  console.log('ℹ All Antigravity account details & credentials are');
  console.log('  already saved locally in ~/.antigravity-agent/cloud_accounts.db.');
  console.log('ℹ No browser OAuth web consent flow is required.\n');

  try {
    const accounts = await fetchAllAntigravityAccountsTelemetry();
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No active Antigravity accounts detected in ~/.antigravity-agent/cloud_accounts.db');
      console.log('   Ensure Antigravity Manager or Antigravity Agent has logged in.');
      return;
    }

    console.log(`✅ Discovered ${accounts.length} active local Antigravity account(s):\n`);
    accounts.forEach((acc, idx) => {
      const email = acc.email || acc.accountId;
      const modelCount = acc.modelDetails?.length || 0;
      const primaryReset = acc.windows?.[0]?.resetLabel || 'Active';
      console.log(`  [Account #${idx + 1}] ${email}`);
      console.log(`    • Models Available: ${modelCount} (Gemini 2.5/3.x, Claude Opus/Sonnet, GPT-OSS)`);
      console.log(`    • Reset Window: ${primaryReset}`);
      console.log(`    • Telemetry Status: Synced from local encrypted store`);
      console.log('');
    });

    console.log('🎉 TokenPilot has full access to your Antigravity accounts.');
    console.log('   Ready for manual job runs, failovers, and test boosters.');
  } catch (err) {
    console.error('❌ Failed to read local Antigravity credentials:', err.message);
  }
}

main();
