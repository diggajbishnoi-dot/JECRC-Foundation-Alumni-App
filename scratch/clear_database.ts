import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning all database tables...');
  try {
    await prisma.$connect();
    
    // Delete in reverse dependency order
    await prisma.jobApplication.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.discussionReply.deleteMany({});
    await prisma.discussionUpvote.deleteMany({});
    await prisma.discussionThread.deleteMany({});
    await prisma.groupMembership.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.mentorshipRequest.deleteMany({});
    await prisma.mentorProfile.deleteMany({});
    await prisma.connection.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.otpVerification.deleteMany({});
    await prisma.deviceToken.deleteMany({});
    await prisma.studentDetails.deleteMany({});
    await prisma.alumniDetails.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('SUCCESS: All database tables cleared 100%!');
  } catch (err: any) {
    console.log('Postgres connection note:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
