import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../app/utils/prisma';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hashPassword('adminpassword');
  // delete all users
  await prisma.user.deleteMany();

  // create admin user or update if already exists

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
    },
  });

  console.log('Admin user created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
