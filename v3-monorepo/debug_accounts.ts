import { prisma } from "@marklabs/database";

async function main() {
  const accounts = await prisma.socialAccount.findMany();
  console.log("--- Contas no Banco de Dados ---");
  console.log(JSON.stringify(accounts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
