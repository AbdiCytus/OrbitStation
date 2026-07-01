import 'dotenv/config';
import { db } from './lib/db';
async function run() {
  const result = await db.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() }
  });
  console.log(`Updated ${result.count} users.`);
}
run();
