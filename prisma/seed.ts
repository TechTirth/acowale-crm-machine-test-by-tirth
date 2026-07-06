import { PrismaClient, Category } from "@prisma/client";

const prisma = new PrismaClient();

const samples: { category: Category; comment: string; email?: string }[] = [
  { category: "BUG", comment: "The submit button spins forever on Safari.", email: "asha@example.com" },
  { category: "FEATURE", comment: "Please add a dark mode for the dashboard." },
  { category: "IMPROVEMENT", comment: "Search should also match partial words." },
  { category: "PRAISE", comment: "Onboarding was the smoothest I've used. Thank you!", email: "milan@example.com" },
  { category: "BUG", comment: "Category filter resets after I refresh the page." },
  { category: "OTHER", comment: "Do you have an API I can integrate with?" },
  { category: "FEATURE", comment: "CSV export of feedback would save my team hours." },
  { category: "IMPROVEMENT", comment: "Mobile layout wraps awkwardly on small screens." },
];

async function main() {
  // Spread createdAt over recent days so the dashboard looks alive.
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    await prisma.feedback.create({
      data: {
        category: s.category,
        comment: s.comment,
        email: s.email,
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 9),
      },
    });
  }
  console.log(`Seeded ${samples.length} feedback rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
