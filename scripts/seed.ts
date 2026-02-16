import { execSync } from "node:child_process";

function run(command: string) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit" });
}

run("tsx scripts/import-pdf-misc.ts");
run("tsx scripts/generate-struggle-sets.ts");

console.log("\nSeed completed.");
