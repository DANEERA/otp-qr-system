const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bookList = require("./bookList"); // <-- ඔයා paste කරපු file

async function main() {
  for (const item of bookList) {
    await prisma.user.upsert({
      where: { bookNumber: item.bookNumber },
      update: {
        fullName: item.fullName,
      },
      create: {
        fullName: item.fullName,
        bookNumber: item.bookNumber,
        mobileNumber: null, // 👈 IMPORTANT FIX
      },
    });
  }

  console.log("✅ All users inserted successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });