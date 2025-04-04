// generate-auth.js
import { create } from "@web3-storage/w3up-client";
import fs from "fs";

async function generateAuth() {
  try {
    console.log("Creating client...");
    const client = await create();

    console.log("Registering principal...");
    const principal = await client.registerPrincipal();

    // Save the principal to a file
    const principalStr = JSON.stringify(principal);
    fs.writeFileSync("principal.json", principalStr);
    console.log("Principal saved to principal.json");

    // Base64 encode for environment variable
    const principalBase64 = Buffer.from(principalStr).toString("base64");
    console.log("Principal key (for W3_PRINCIPAL_KEY):");
    console.log(principalBase64);

    // Now you need to authenticate the principal
    console.log("\nNow you need to authenticate this principal.");
    console.log("Enter your email:");

    // Here you'd typically take input, but for this example:
    const email = "asirroudra@gmail.com"; // Replace with your email

    console.log(`Authenticating ${email}...`);
    await client.login(email);

    console.log("\nCheck your email for a verification link and click it.");
    console.log("Once verified, run this script again to get the proof.");

    // After verification, you'd get a proof
    // You can save and encode it similar to the principal
  } catch (error) {
    console.error("Error:", error);
  }
}

generateAuth();
