import { CoordinatorAgent } from './agents/coordinator';

async function main() {
  const symbol = process.argv[2] || 'TSLA';
  console.log(`\n🚀 Analyzing: ${symbol}\n`);

  const coordinator = new CoordinatorAgent();
  await coordinator.analyzeStock(symbol);

  console.log('\n✅ Done!\n');
}

main().catch(console.error);
