import { generateCalibratedEditorialDraft } from "../src/server/polibrawl/services/editorial/calibrated-editorial-generation.service";

async function main() {
  const packetId = process.argv[2];
  if (!packetId) {
    console.error("Usage: npx tsx scripts/qa-execute-calibrated-generation.ts <packet_id>");
    process.exit(1);
  }

  console.log(`Starting calibrated generation for packet: ${packetId}`);
  
  try {
    const result = await generateCalibratedEditorialDraft({
      researchPacketId: packetId,
    });
    
    console.log("Generation Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error during generation:");
    console.error(err);
    process.exit(1);
  }
}

main();
