import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Clearing Alumni App Database ---');

  // Clear existing records in proper dependency order
  await prisma.notification.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.discussionUpvote.deleteMany();
  await prisma.discussionReply.deleteMany();
  await prisma.discussionThread.deleteMany();
  await prisma.group.deleteMany();
  await prisma.mentorshipRequest.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.message.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.post.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.studentDetails.deleteMany();
  await prisma.alumniDetails.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Database cleared. 0 fake users seeded. Ready for real registrations. ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
