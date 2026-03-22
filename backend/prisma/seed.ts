import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.videoProgress.deleteMany({});
  await prisma.video.deleteMany({ where: { orderIndex: 0 } });
  await prisma.section.deleteMany({ where: { orderIndex: 0 } });

  const inputSubjects = [
    {
      title: "UI/UX Design Mastery",
      slug: "uiux-design-mastery",
      thumbnailUrl: "https://img.youtube.com/vi/c9Wg6Cb_YlU/maxresdefault.jpg",
      desc: "Learn the exact spatial logic and color theories necessary to build stunning, premium visual interfaces from scratch.",
      instructorName: "Gary Simon",
      instructorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=GarySimon",
      category: "Design",
      whatYouWillLearn: JSON.stringify([
        "Understand core UI and UX design principles",
        "Design beautiful interfaces using Figma",
        "Create wireframes, prototypes and design systems",
        "Build a strong design portfolio from scratch"
      ]),
      sectionTitle: "Introduction to UI/UX",
      videoTitle: "UI/UX Design Full Course",
      videoDesc: "Complete UI/UX design course covering Figma, wireframing and design principles",
      youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
      durationSeconds: 14400
    },
    {
      title: "Advanced React",
      slug: "advanced-react",
      thumbnailUrl: "https://img.youtube.com/vi/x4rFhThSX04/maxresdefault.jpg",
      desc: "Master the core mechanics of scalable React applications, Zustand state management, and strict TypeScript integration.",
      instructorName: "Bob Ziroll",
      instructorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=BobZiroll",
      category: "Frontend",
      whatYouWillLearn: JSON.stringify([
        "Master React hooks including useState and useEffect",
        "Manage complex state using Zustand and Context API",
        "Integrate TypeScript strictly into React projects",
        "Build and deploy scalable real-world React applications"
      ]),
      sectionTitle: "Introduction",
      videoTitle: "Learn React JS - Full Course 2024",
      videoDesc: "Complete React course with 170+ challenges and 6 real-world projects",
      youtubeUrl: "https://www.youtube.com/watch?v=x4rFhThSX04",
      durationSeconds: 54000
    },
    {
      title: "Python Programming",
      slug: "python-programming",
      thumbnailUrl: "https://img.youtube.com/vi/_uQrJ0TkZlc/maxresdefault.jpg",
      desc: "Python is one of the most beginner-friendly and powerful programming languages in the world. In this course, you'll start from absolute zero — learning variables, data types, type casting, loops, functions, and object-oriented programming. By the end, you'll be able to write real scripts, automate tasks, and build the foundation needed for backend development, data science, or AI.",
      sectionTitle: "Introduction",
      videoTitle: "Python Full Course for Beginners",
      videoDesc: "Complete Python programming course from scratch",
      youtubeUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
      durationSeconds: 14400
    },
    {
      title: "Frontend Development",
      slug: "frontend-development",
      thumbnailUrl: "https://img.youtube.com/vi/zJSY8tbf_ys/maxresdefault.jpg",
      desc: "Frontend development is all about building what users see and interact with on the web. This course covers the full trio — HTML for structure, CSS for styling, and JavaScript for interactivity. You'll learn how to build responsive layouts, style components beautifully, handle DOM events, and create dynamic user interfaces that work across all devices and screen sizes.",
      sectionTitle: "Introduction",
      videoTitle: "Frontend Web Development Bootcamp",
      videoDesc: "Complete frontend development course",
      youtubeUrl: "https://www.youtube.com/watch?v=zJSY8tbf_ys",
      durationSeconds: 21600
    },
    {
      title: "SQL & Databases",
      slug: "sql-databases",
      thumbnailUrl: "https://img.youtube.com/vi/HXV3zeQKqGY/maxresdefault.jpg",
      desc: "Databases are the backbone of every application, and SQL is the language used to talk to them. This course takes you from basic SELECT queries all the way to complex JOINs, subqueries, indexes, and transactions. You'll learn how to design normalized schemas, write efficient queries, and manage relational data using MySQL — one of the most widely used databases in the industry.",
      sectionTitle: "Introduction",
      videoTitle: "SQL Tutorial Full Database Course",
      videoDesc: "Complete SQL and database course for beginners",
      youtubeUrl: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      durationSeconds: 14400
    },
    {
      title: "React.js",
      slug: "react-js",
      thumbnailUrl: "https://img.youtube.com/vi/bMknfKXIFA8/maxresdefault.jpg",
      desc: "React is the most popular JavaScript library for building modern, component-based user interfaces. This course covers everything from JSX and props to state management, hooks like useState and useEffect, and connecting to REST APIs. You'll build real projects that mirror what professional frontend developers ship every day at top tech companies around the world.",
      sectionTitle: "Introduction",
      videoTitle: "React Course for Beginners",
      videoDesc: "Complete React.js course from scratch",
      youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8",
      durationSeconds: 11520
    },
    {
      title: "Node.js & Express",
      slug: "nodejs-express",
      thumbnailUrl: "https://img.youtube.com/vi/Oe421EPjeBE/maxresdefault.jpg",
      desc: "Node.js brings JavaScript to the server side, and Express makes building REST APIs fast and clean. In this course you'll learn how to create API routes, handle middleware, connect to databases, manage authentication with JWT, and structure a production-ready backend. This is the exact stack powering thousands of real-world applications running at scale today.",
      sectionTitle: "Introduction",
      videoTitle: "Node.js and Express Full Course",
      videoDesc: "Complete Node.js backend development course",
      youtubeUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
      durationSeconds: 14400
    },
    {
      title: "CSS & Tailwind",
      slug: "css-tailwind",
      thumbnailUrl: "https://img.youtube.com/vi/OXGznpKZ_sA/maxresdefault.jpg",
      desc: "Great UI starts with great CSS. This course covers core CSS concepts — the box model, flexbox, grid, animations, and responsive design — before diving into Tailwind CSS, the utility-first framework that lets you build stunning interfaces without ever leaving your HTML. You'll go from basic styling to professional, pixel-perfect designs that look great on any screen size.",
      sectionTitle: "Introduction",
      videoTitle: "CSS and Tailwind Full Course",
      videoDesc: "Complete CSS and Tailwind CSS course",
      youtubeUrl: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
      durationSeconds: 10800
    },
    {
      title: "TypeScript",
      slug: "typescript",
      thumbnailUrl: "https://img.youtube.com/vi/30LWjhZzg50/maxresdefault.jpg",
      desc: "TypeScript is JavaScript with superpowers — it adds static types that catch bugs before your code even runs. This course covers type annotations, interfaces, generics, enums, and how to integrate TypeScript into both frontend and backend projects. Learning TypeScript will make you a significantly more confident and productive developer, especially on larger codebases and team projects.",
      sectionTitle: "Introduction",
      videoTitle: "TypeScript Full Course for Beginners",
      videoDesc: "Complete TypeScript course from scratch",
      youtubeUrl: "https://www.youtube.com/watch?v=30LWjhZzg50",
      durationSeconds: 10800
    },
    {
      title: "Data Structures & Algorithms",
      slug: "dsa",
      thumbnailUrl: "https://img.youtube.com/vi/8hly31xKli0/maxresdefault.jpg",
      desc: "Data Structures and Algorithms are the foundation of computer science and the key to cracking technical interviews. This course covers arrays, linked lists, stacks, queues, trees, graphs, sorting algorithms, and dynamic programming. Each concept is explained visually and practically, with real coding problems so you build both the intuition and the problem-solving skills that top companies test for.",
      sectionTitle: "Introduction",
      videoTitle: "Data Structures and Algorithms Full Course",
      videoDesc: "Complete DSA course for coding interviews",
      youtubeUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
      durationSeconds: 18000
    },
    {
      title: "Next.js",
      slug: "next-js",
      thumbnailUrl: "https://img.youtube.com/vi/KjY94sAKLlw/maxresdefault.jpg",
      desc: "Next.js is the go-to framework for building full-stack React applications with features like server-side rendering, static generation, the App Router, and API routes built in. This course walks you through building production-grade web apps — handling routing, data fetching strategies, authentication, and deployment to Vercel. It's the framework behind some of the fastest and most scalable websites on the internet.",
      sectionTitle: "Introduction",
      videoTitle: "Next.js Full Course for Beginners",
      videoDesc: "Complete Next.js course with App Router",
      youtubeUrl: "https://www.youtube.com/watch?v=KjY94sAKLlw",
      durationSeconds: 12600
    },
    {
      title: "Git & GitHub",
      slug: "git-github",
      thumbnailUrl: "https://img.youtube.com/vi/RGOj5yH7evk/maxresdefault.jpg",
      desc: "Every professional developer uses Git daily — it's the industry-standard tool for version control and collaboration. This course covers everything from your first commit to branching strategies, resolving merge conflicts, pull requests, and working in team workflows on GitHub. Whether you're building solo projects or contributing to open source, mastering Git is a non-negotiable skill in your developer toolkit.",
      sectionTitle: "Introduction",
      videoTitle: "Git and GitHub Full Course",
      videoDesc: "Complete Git version control course",
      youtubeUrl: "https://www.youtube.com/watch?v=RGOj5yH7evk",
      durationSeconds: 10800
    }
  ];

  for (const sub of inputSubjects) {
     const subject = await prisma.subject.upsert({
       where: { slug: sub.slug },
       update: {
          title: sub.title,
          description: sub.desc,
          thumbnailUrl: sub.thumbnailUrl,
          instructorName: sub.instructorName || null,
          instructorPhoto: sub.instructorPhoto || null,
          category: sub.category || null,
          whatYouWillLearn: sub.whatYouWillLearn || null,
          isPublished: true
       },
       create: {
          title: sub.title,
          slug: sub.slug,
          description: sub.desc,
          thumbnailUrl: sub.thumbnailUrl,
          instructorName: sub.instructorName || null,
          instructorPhoto: sub.instructorPhoto || null,
          category: sub.category || null,
          whatYouWillLearn: sub.whatYouWillLearn || null,
          isPublished: true
       }
     });

     const section = await prisma.section.upsert({
        where: { subjectId_orderIndex: { subjectId: subject.id, orderIndex: 1 } },
        update: {
           title: sub.sectionTitle
        },
        create: {
           subjectId: subject.id,
           title: sub.sectionTitle,
           orderIndex: 1
        }
     });

     await prisma.video.upsert({
        where: { sectionId_orderIndex: { sectionId: section.id, orderIndex: 1 } },
        update: {
           title: sub.videoTitle,
           description: sub.videoDesc,
           youtubeUrl: sub.youtubeUrl,
           durationSeconds: sub.durationSeconds
        },
        create: {
           sectionId: section.id,
           title: sub.videoTitle,
           description: sub.videoDesc,
           youtubeUrl: sub.youtubeUrl,
           orderIndex: 1,
           durationSeconds: sub.durationSeconds
        }
     });
     console.log(`Successfully Upserted: ${sub.title} [Subject->Section->Video]`);
  }

  console.log("Database seeded completely with nested Upserts.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
