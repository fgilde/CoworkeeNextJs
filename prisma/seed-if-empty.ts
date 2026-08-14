import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  const userCount = await db.user.count();
  if (userCount > 0) {
    console.log("DB not empty, skip seed");
    await db.$disconnect?.();
    return;
  }
  await import("./seed");
}

main()
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect?.();
    process.exit(1);
  });
