import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({
      include: {
        alumniDetails: true,
        studentDetails: true,
      },
    });
    console.log('=== DATABASE USER REPORT ===');
    console.log(`Total users in database: ${users.length}`);
    users.forEach((u, i) => {
      console.log(`[${i + 1}] ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Verified: ${u.isVerified}`);
      if (u.alumniDetails) {
        console.log(`    Alumni: Branch: ${u.alumniDetails.branch}, Batch: ${u.alumniDetails.batch}, Company: ${u.alumniDetails.currentCompany}, Title: ${u.alumniDetails.designation}`);
      }
      if (u.studentDetails) {
        console.log(`    Student: Branch: ${u.studentDetails.branch}, Year: ${u.studentDetails.currentYear}, Passout: ${u.studentDetails.expectedPassoutYear}`);
      }
    });

    const posts = await prisma.post.findMany();
    console.log(`Total posts in database: ${posts.length}`);

    const threads = await prisma.discussionThread.findMany();
    console.log(`Total discussion threads in database: ${threads.length}`);

  } catch (err: any) {
    console.error('Database connection error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
