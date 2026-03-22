import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const inputSubjects = [
    {
      title: "Python Programming",
      slug: "python-programming",
      thumbnailUrl: "https://img.youtube.com/vi/_uQrJ0TkZlc/maxresdefault.jpg",
      introVideo: "_uQrJ0TkZlc",
      desc: "Python is one of the most beginner-friendly and powerful programming languages in the world. In this course, you'll start from absolute zero — learning variables, data types, type casting, loops, functions, and object-oriented programming. By the end, you'll be able to write real scripts, automate tasks, and build the foundation needed for backend development, data science, or AI."
    },
    {
      title: "Frontend Development",
      slug: "frontend-development",
      thumbnailUrl: "https://img.youtube.com/vi/zJSY8tbf_ys/maxresdefault.jpg",
      introVideo: "zJSY8tbf_ys",
      desc: "Frontend development is all about building what users see and interact with on the web. This course covers the full trio — HTML for structure, CSS for styling, and JavaScript for interactivity. You'll learn how to build responsive layouts, style components beautifully, handle DOM events, and create dynamic user interfaces that work across all devices and screen sizes."
    },
    {
      title: "SQL & Databases",
      slug: "sql-databases",
      thumbnailUrl: "https://img.youtube.com/vi/HXV3zeQKqGY/maxresdefault.jpg",
      introVideo: "HXV3zeQKqGY",
      desc: "Databases are the backbone of every application, and SQL is the language used to talk to them. This course takes you from basic SELECT queries all the way to complex JOINs, subqueries, indexes, and transactions. You'll learn how to design normalized schemas, write efficient queries, and manage relational data using MySQL — one of the most widely used databases in the industry."
    },
    {
      title: "React.js",
      slug: "react-js",
      thumbnailUrl: "https://img.youtube.com/vi/bMknfKXIFA8/maxresdefault.jpg",
      introVideo: "bMknfKXIFA8",
      desc: "React is the most popular JavaScript library for building modern, component-based user interfaces. This course covers everything from JSX and props to state management, hooks like useState and useEffect, and connecting to REST APIs. You'll build real projects that mirror what professional frontend developers ship every day at top tech companies around the world."
    },
    {
      title: "Node.js & Express",
      slug: "nodejs-express",
      thumbnailUrl: "https://img.youtube.com/vi/Oe421EPjeBE/maxresdefault.jpg",
      introVideo: "Oe421EPjeBE",
      desc: "Node.js brings JavaScript to the server side, and Express makes building REST APIs fast and clean. In this course you'll learn how to create API routes, handle middleware, connect to databases, manage authentication with JWT, and structure a production-ready backend. This is the exact stack powering thousands of real-world applications running at scale today."
    },
    {
      title: "CSS & Tailwind",
      slug: "css-tailwind",
      thumbnailUrl: "https://img.youtube.com/vi/OXGznpKZ_sA/maxresdefault.jpg",
      introVideo: "OXGznpKZ_sA",
      desc: "Great UI starts with great CSS. This course covers core CSS concepts — the box model, flexbox, grid, animations, and responsive design — before diving into Tailwind CSS, the utility-first framework that lets you build stunning interfaces without ever leaving your HTML. You'll go from basic styling to professional, pixel-perfect designs that look great on any screen size."
    },
    {
      title: "TypeScript",
      slug: "typescript",
      thumbnailUrl: "https://img.youtube.com/vi/30LWjhZzg50/maxresdefault.jpg",
      introVideo: "30LWjhZzg50",
      desc: "TypeScript is JavaScript with superpowers — it adds static types that catch bugs before your code even runs. This course covers type annotations, interfaces, generics, enums, and how to integrate TypeScript into both frontend and backend projects. Learning TypeScript will make you a significantly more confident and productive developer, especially on larger codebases and team projects."
    },
    {
      title: "Data Structures & Algorithms",
      slug: "dsa",
      thumbnailUrl: "https://img.youtube.com/vi/8hly31xKli0/maxresdefault.jpg",
      introVideo: "8hly31xKli0",
      desc: "Data Structures and Algorithms are the foundation of computer science and the key to cracking technical interviews. This course covers arrays, linked lists, stacks, queues, trees, graphs, sorting algorithms, and dynamic programming. Each concept is explained visually and practically, with real coding problems so you build both the intuition and the problem-solving skills that top companies test for."
    },
    {
      title: "Next.js",
      slug: "next-js",
      thumbnailUrl: "https://img.youtube.com/vi/KjY94sAKLlw/maxresdefault.jpg",
      introVideo: "KjY94sAKLlw",
      desc: "Next.js is the go-to framework for building full-stack React applications with features like server-side rendering, static generation, the App Router, and API routes built in. This course walks you through building production-grade web apps — handling routing, data fetching strategies, authentication, and deployment to Vercel. It's the framework behind some of the fastest and most scalable websites on the internet."
    },
    {
      title: "Git & GitHub",
      slug: "git-github",
      thumbnailUrl: "https://img.youtube.com/vi/RGOj5yH7evk/maxresdefault.jpg",
      introVideo: "RGOj5yH7evk",
      desc: "Every professional developer uses Git daily — it's the industry-standard tool for version control and collaboration. This course covers everything from your first commit to branching strategies, resolving merge conflicts, pull requests, and working in team workflows on GitHub. Whether you're building solo projects or contributing to open source, mastering Git is a non-negotiable skill in your developer toolkit."
    }
  ];

  for (const sub of inputSubjects) {
    const existing = await prisma.subject.findUnique({ where: { slug: sub.slug } });
    if (!existing) {
      await prisma.subject.create({
        data: {
          title: sub.title,
          slug: sub.slug,
          description: sub.desc,
          thumbnailUrl: sub.thumbnailUrl,
          isPublished: true,
          sections: {
            create: [
              {
                title: "Introduction",
                orderIndex: 0,
                videos: {
                  create: [
                    {
                      title: `Welcome to ${sub.title}`,
                      youtubeUrl: sub.introVideo,
                      orderIndex: 0,
                      description: `An introduction to the core concepts of ${sub.title}.`,
                      durationSeconds: 300
                    }
                  ]
                }
              }
            ]
          }
        }
      });
    } else {
      await prisma.subject.update({
         where: { slug: sub.slug },
         data: { thumbnailUrl: sub.thumbnailUrl }
      });
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
