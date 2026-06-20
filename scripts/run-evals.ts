import { runEvals } from "@/lib/evalRunner";

async function main() {
  const results = await runEvals();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
