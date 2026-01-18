import { prisma } from "../src/client";

async function main() {
  console.log("Seeding...");

  await Promise.resolve(new Promise(resolve => setTimeout(resolve, 3000)))

  console.log("Seeding Completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
