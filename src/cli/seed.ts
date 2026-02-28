import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { FileSkillRepository } from '../infrastructure/skill/FileSkillRepository';

const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL']! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});

// ---------- helpers ----------

function loadJson<T>(relativePath: string): T {
  const absolute = resolve(__dirname, '..', relativePath);
  return JSON.parse(readFileSync(absolute, 'utf-8')) as T;
}

function extractModel(fullName: string, brand: string): string {
  // Remove the brand prefix (case-insensitive) and trim
  const regex = new RegExp(`^${escapeRegex(brand)}\\s*`, 'i');
  return fullName.replace(regex, '').trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseWeight(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
}

// ---------- types for JSON data ----------

interface CategoryJson {
  id: string;
  name: string;
  description: string;
}

interface ProductJson {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  brand: string;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    gpu: string;
    display: string;
    weight: number | string;
    os: string;
  };
  imageUrl: string;
  couponUrl: string;
}

interface ReviewJson {
  productId: string;
  summary: string;
  pros: string[];
  cons: string[];
  rating: number;
}

// ---------- main seed function ----------

async function main() {
  console.log('Starting seed...\n');

  // 1. Seed categories
  const categories = loadJson<CategoryJson[]>('data/categories.json');
  console.log(`Seeding ${categories.length} categories...`);

  for (const cat of categories) {
    const result = await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        description: cat.description,
      },
      create: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
      },
    });
    console.log(`  Category: ${result.name} (${result.id})`);
  }

  // 2. Seed products
  const products = loadJson<ProductJson[]>('data/products.json');
  console.log(`\nSeeding ${products.length} products...`);

  // Map from JSON product id (slug) to Prisma product id (uuid)
  const slugToProductId = new Map<string, string>();

  for (const prod of products) {
    const slug = prod.id;
    const maker = prod.brand;
    const model = extractModel(prod.name, prod.brand);
    const weight = parseWeight(prod.specs.weight);

    const result = await prisma.product.upsert({
      where: { slug },
      update: {
        maker,
        model,
        cpu: prod.specs.cpu,
        ram: prod.specs.ram,
        storage: prod.specs.storage,
        gpu: prod.specs.gpu,
        displaySize: prod.specs.display,
        weight,
        os: prod.specs.os,
        price: prod.price,
        imageUrl: prod.imageUrl,
        couponUrl: prod.couponUrl,
        categoryId: prod.categoryId,
      },
      create: {
        slug,
        maker,
        model,
        cpu: prod.specs.cpu,
        ram: prod.specs.ram,
        storage: prod.specs.storage,
        gpu: prod.specs.gpu,
        displaySize: prod.specs.display,
        weight,
        os: prod.specs.os,
        price: prod.price,
        imageUrl: prod.imageUrl,
        couponUrl: prod.couponUrl,
        categoryId: prod.categoryId,
      },
    });

    slugToProductId.set(slug, result.id);
    console.log(`  Product: ${result.maker} ${result.model} (slug: ${slug})`);

    // Create CategoryAssignment if categoryId exists
    if (prod.categoryId) {
      await prisma.categoryAssignment.upsert({
        where: {
          productId_categoryId: {
            productId: result.id,
            categoryId: prod.categoryId,
          },
        },
        update: {},
        create: {
          productId: result.id,
          categoryId: prod.categoryId,
        },
      });
      console.log(`    -> Assigned to category: ${prod.categoryId}`);
    }
  }

  // 3. Seed reviews
  const reviews = loadJson<ReviewJson[]>('data/reviews.json');
  console.log(`\nSeeding ${reviews.length} reviews...`);

  for (const review of reviews) {
    const productId = slugToProductId.get(review.productId);
    if (!productId) {
      console.warn(`  WARNING: No product found for slug "${review.productId}", skipping review.`);
      continue;
    }

    const result = await prisma.productReview.upsert({
      where: {
        id: `seed-review-${review.productId}`,
      },
      update: {
        summary: review.summary,
        pros: review.pros,
        cons: review.cons,
        rating: review.rating,
        recommendedFor: '',
        notRecommendedFor: '',
        specHighlights: [],
      },
      create: {
        id: `seed-review-${review.productId}`,
        productId,
        summary: review.summary,
        pros: review.pros,
        cons: review.cons,
        rating: review.rating,
        recommendedFor: '',
        notRecommendedFor: '',
        specHighlights: [],
      },
    });
    console.log(`  Review for ${review.productId}: ${result.summary.substring(0, 40)}...`);
  }

  // 4. Seed AI skills (loaded from src/skills/ SKILL.md files)
  const fileSkillRepo = new FileSkillRepository();
  const aiSkills = await fileSkillRepo.findAll();
  console.log(`\nSeeding ${aiSkills.length} AI skills...`);

  for (const skill of aiSkills) {
    const result = await prisma.aiSkill.upsert({
      where: { name: skill.name },
      update: {
        systemPromptTemplate: skill.systemPromptTemplate,
        userPromptTemplate: skill.userPromptTemplate,
        temperature: skill.temperature,
        model: skill.model,
        version: skill.version,
      },
      create: {
        name: skill.name,
        systemPromptTemplate: skill.systemPromptTemplate,
        userPromptTemplate: skill.userPromptTemplate,
        temperature: skill.temperature,
        model: skill.model,
        version: skill.version,
      },
    });
    console.log(`  Skill: ${result.name} (v${result.version})`);
  }

  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
