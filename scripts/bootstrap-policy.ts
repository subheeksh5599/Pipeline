import { ethers } from "ethers";

const RPC = process.env.ARC_RPC_URL ?? "http://localhost:8545";
const KEY = process.env.PRIVATE_KEY ?? "";
const ADDRESS = process.env.POLICY_ADDRESS ?? "";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(KEY, provider);

  const abi = [
    "function createBudget(address,uint256,uint256) returns (uint256)",
    "function setEndpointRule(address,bytes4,bool,uint256,uint256,bytes4)",
  ];
  const policy = new ethers.Contract(ADDRESS, abi, wallet);

  const agent = wallet.address;
  const oneUSDC = ethers.parseUnits("5000", 6);
  const rateLimit = ethers.parseUnits("100", 6);

  const tx1 = await policy.createBudget(agent, oneUSDC, rateLimit);
  await tx1.wait();
  console.log(`budget created: ${tx1.hash}`);

  const endpoints = [
    { addr: "0x0000000000000000000000000000000000000001", method: "0x00000000", cat: "0x636f6e74" },
    { addr: "0x0000000000000000000000000000000000000002", method: "0x00000000", cat: "0x7374726d" },
  ];

  for (const ep of endpoints) {
    const tx = await policy.setEndpointRule(ep.addr, ep.method, true, ethers.parseUnits("50", 6), ethers.parseUnits("500", 6), ep.cat);
    await tx.wait();
    console.log(`endpoint rule set: ${ep.addr} ${tx.hash}`);
  }

  console.log("bootstrap complete");
}

main().catch(console.error);
