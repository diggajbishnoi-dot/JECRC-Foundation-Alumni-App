import {
  ConnectionStatus,
  GroupRole,
  GroupType,
  MentorshipStatus,
  MessageStatus,
  OtpChannel,
  PostType,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Alumni App Database ---');

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

  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'JECRC Alumni Cell Admin',
      email: 'admin@jecrc.ac.in',
      mobile: '+919999900000',
      passwordHash: defaultPassword,
      role: Role.ADMIN,
      isVerified: true,
      bio: 'JECRC Foundation Alumni Relations & Placement Directorate',
      city: 'Jaipur',
    },
  });
  console.log(`Created Admin: ${admin.email}`);

  // 2. Create Alumni Users
  const alumni1 = await prisma.user.create({
    data: {
      name: 'Aarav Mehta',
      email: 'aarav.mehta@jecrc.ac.in',
      mobile: '+919811122233',
      passwordHash: defaultPassword,
      role: Role.ALUMNI,
      isVerified: true,
      bio: 'Staff Engineer at Google | Cloud Infrastructure & Distributed Systems',
      city: 'Bengaluru',
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      publicKey: 'dGhpcy1pcy1hYXJhdnMteDI1NTE5LXB1YmxpYy1rZXk=',
      alumniDetails: {
        create: {
          branch: 'Computer Science and Engineering',
          batch: '2016-2020',
          passoutYear: 2020,
          currentCompany: 'Google',
          designation: 'Staff Software Engineer',
        },
      },
      mentorProfile: {
        create: {
          domains: ['Cloud Architecture', 'Distributed Systems', 'FAANG Interview Prep'],
          bio: 'Passionate about mentoring juniors on high-scale systems and career planning.',
          availability: '2 sessions per month (45m)',
          maxMentees: 4,
          isActive: true,
        },
      },
    },
  });

  const alumni2 = await prisma.user.create({
    data: {
      name: 'Pooja Iyer',
      email: 'pooja.iyer@jecrc.ac.in',
      mobile: '+919822233344',
      passwordHash: defaultPassword,
      role: Role.ALUMNI,
      isVerified: true,
      bio: 'Product Lead at Stripe | FinTech & API Ecosystems',
      city: 'San Francisco',
      profilePicUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
      publicKey: 'dGhpcy1pcy1wb29qYXMteDI1NTE5LXB1YmxpYy1rZXk=',
      alumniDetails: {
        create: {
          branch: 'Electrical Engineering',
          batch: '2015-2019',
          passoutYear: 2019,
          currentCompany: 'Stripe',
          designation: 'Lead Product Manager',
        },
      },
      mentorProfile: {
        create: {
          domains: ['Product Management', 'FinTech', 'Higher Studies Abroad'],
          bio: 'Graduated from Stanford MS after B.Tech. Mentoring on PM and MS applications.',
          availability: '1 session per month',
          maxMentees: 2,
          isActive: true,
        },
      },
    },
  });

  // 3. Create Student Users
  const student1 = await prisma.user.create({
    data: {
      name: 'Rohan Verma',
      email: 'rohan.v@jecrc.ac.in',
      mobile: '+919833344455',
      passwordHash: defaultPassword,
      role: Role.STUDENT,
      isVerified: true,
      bio: '3rd Year CSE student at JECRC exploring Distributed Systems and Open Source',
      city: 'Jaipur',
      profilePicUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
      publicKey: 'dGhpcy1pcy1yb2hhbnMteDI1NTE5LXB1YmxpYy1rZXk=',
      studentDetails: {
        create: {
          branch: 'Computer Science and Engineering',
          currentYear: 3,
          expectedPassoutYear: 2027,
        },
      },
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Sneha Patel',
      email: 'sneha.p@jecrc.ac.in',
      mobile: '+919844455566',
      passwordHash: defaultPassword,
      role: Role.STUDENT,
      isVerified: true,
      bio: 'Final year Electronics student at JECRC passionate about IoT & Embedded Systems',
      city: 'Jaipur',
      profilePicUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      publicKey: 'dGhpcy1pcy1zbmVoYXMteDI1NTE5LXB1YmxpYy1rZXk=',
      studentDetails: {
        create: {
          branch: 'Electronics and Communication Engineering',
          currentYear: 4,
          expectedPassoutYear: 2026,
        },
      },
    },
  });

  console.log('Created Users (Alumni & Students)');

  // 4. Create Accepted Connection between Aarav and Rohan
  await prisma.connection.create({
    data: {
      requesterId: student1.id,
      receiverId: alumni1.id,
      status: ConnectionStatus.ACCEPTED,
    },
  });

  // 5. Create Pending Connection between Sneha and Pooja
  await prisma.connection.create({
    data: {
      requesterId: student2.id,
      receiverId: alumni2.id,
      status: ConnectionStatus.PENDING,
    },
  });

  // 6. Create Seed Messages (Ciphertext only - demonstrating WhatsApp-style zero knowledge!)
  await prisma.message.createMany({
    data: [
      {
        senderId: student1.id,
        receiverId: alumni1.id,
        encryptedContent: '5a4b3c2d1e0f==[CIPHERTEXT_DEMO_ENCRYPTED_WITH_X25519_KEY]==',
        nonce: 'YWJjZGVmZ2hpamtsbW5vcA==',
        status: MessageStatus.READ,
      },
      {
        senderId: alumni1.id,
        receiverId: student1.id,
        encryptedContent: '9f8e7d6c5b4a==[CIPHERTEXT_DEMO_REPLY_FROM_ALUMNI]==',
        nonce: 'cHFyc3R1dnd4eXoxMjM0NQ==',
        status: MessageStatus.DELIVERED,
      },
    ],
  });

  // 7. Create Job Posts
  await prisma.post.createMany({
    data: [
      {
        userId: alumni1.id,
        type: PostType.JOB,
        title: 'Backend Software Engineer — Google Cloud Platform',
        description:
          'Our team in Bengaluru is looking for strong backend engineers with Golang/C++/Java experience. Happy to refer college alumni directly!',
        company: 'Google',
        location: 'Bengaluru, India (Hybrid)',
        attachmentUrl: 'https://careers.google.com/jobs/results/12345',
      },
      {
        userId: alumni2.id,
        type: PostType.INTERNSHIP,
        title: 'Summer 2027 Product Management Internship — Stripe',
        description:
          'Stripe is accepting applications for summer product interns. Mentorship, competitive stipend, and PPO opportunities.',
        company: 'Stripe',
        location: 'Bengaluru / Remote',
        attachmentUrl: 'https://stripe.com/jobs/internship-2027',
      },
      {
        userId: alumni1.id,
        type: PostType.GENERAL,
        title: 'Annual Bangalore Chapter Alumni Meet 2026',
        description:
          'Excited to announce our annual in-person alumni meet next month in Indiranagar. Looking forward to catching up with everyone!',
      },
    ],
  });

  // 8. Create Discussion Forum Threads & Replies
  const thread1 = await prisma.discussionThread.create({
    data: {
      userId: student1.id,
      title: 'How to effectively prepare for System Design interviews as a fresh grad?',
      description:
        'Most college curricula focus on DSA, but many high-paying roles evaluate basic system design. What resources or open-source projects helped you the most?',
      category: 'Career Advice',
    },
  });

  const reply1 = await prisma.discussionReply.create({
    data: {
      threadId: thread1.id,
      userId: alumni1.id,
      content:
        'Start with Designing Data-Intensive Applications (DDIA by Martin Kleppmann) and build a miniature key-value store or URL shortener. Focus on understanding tradeoffs between latency, consistency, and storage.',
    },
  });

  await prisma.discussionUpvote.create({
    data: {
      threadId: thread1.id,
      userId: alumni2.id,
    },
  });

  await prisma.discussionUpvote.create({
    data: {
      replyId: reply1.id,
      userId: student1.id,
    },
  });

  // 9. Create Mentorship Request
  await prisma.mentorshipRequest.create({
    data: {
      studentId: student1.id,
      mentorId: alumni1.id,
      message:
        'Hi Aarav bhaiya, I have read your distributed systems articles and would love guidance on preparing for cloud infrastructure engineering roles.',
      status: MentorshipStatus.ACCEPTED,
    },
  });

  // 10. Create Affinity Groups (Batch & Interest)
  const cse2020Group = await prisma.group.create({
    data: {
      name: 'JECRC CSE Batch of 2020',
      type: GroupType.BATCH,
      description: 'Official batch group for Computer Science graduates of JECRC Foundation class 2020.',
      createdById: alumni1.id,
    },
  });

  const foundersGroup = await prisma.group.create({
    data: {
      name: 'JECRC Founders & Angel Investors Club',
      type: GroupType.INTEREST,
      description: 'A close-knit community of JECRC Foundation alumni building innovative startups.',
      createdById: alumni2.id,
    },
  });

  await prisma.groupMembership.createMany({
    data: [
      { groupId: cse2020Group.id, userId: alumni1.id, role: GroupRole.ADMIN },
      { groupId: foundersGroup.id, userId: alumni2.id, role: GroupRole.ADMIN },
      { groupId: foundersGroup.id, userId: student1.id, role: GroupRole.MEMBER },
    ],
  });

  console.log('--- Seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
