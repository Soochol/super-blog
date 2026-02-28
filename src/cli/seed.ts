import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

// ---------- seed data ----------

const aiSkills = [
  {
    name: 'discover-listing-urls',
    systemPromptTemplate: '당신은 한국 IT 제품 시장 전문가입니다. 정확한 URL만 제공하세요.',
    userPromptTemplate:
      '한국에서 판매되는 주요 {{category}} 제조사({{makers}})의 공식 웹사이트에서 {{category}} 제품 목록을 볼 수 있는 페이지 URL을 각각 1개씩 알려줘. 한국 공식 사이트 URL을 우선으로 해줘. URL만 깔끔하게 리스트로.',
    temperature: 0.3,
    model: 'claude',
    version: '1.0.0',
  },
  {
    name: 'validate-listing-page',
    systemPromptTemplate: '당신은 웹페이지 분류 전문가입니다.',
    userPromptTemplate:
      '다음 HTML이 {{category}} 제품 목록 페이지인지 확인해줘. "YES" 또는 "NO"만 답해.\n\nURL: {{url}}\nHTML (처음 5000자):\n{{html}}',
    temperature: 0.1,
    model: 'claude',
    version: '1.0.0',
  },
  {
    name: 'extract-product-links',
    systemPromptTemplate:
      '당신은 웹 크롤링 전문가입니다. HTML에서 제품 상세 페이지 링크를 정확히 추출합니다.',
    userPromptTemplate:
      '다음 HTML에서 개별 {{category}} 제품 상세 페이지로 이동하는 링크 URL을 추출해줘. 절대 URL로 변환해서 리스트로 알려줘. 최대 {{maxLinks}}개.\n\nBase URL: {{baseUrl}}\nHTML (처음 15000자):\n{{html}}',
    temperature: 0.2,
    model: 'claude',
    version: '1.0.0',
  },
  {
    name: 'extract-product-image',
    systemPromptTemplate: '당신은 웹페이지에서 제품 이미지를 식별하는 전문가입니다.',
    userPromptTemplate:
      '다음 HTML에서 메인 제품 이미지 URL을 1개만 추출해줘. URL만 답해.\n\n{{html}}',
    temperature: 0.1,
    model: 'claude',
    version: '1.0.0',
  },
  {
    name: 'generate-review',
    systemPromptTemplate:
      '당신은 한국의 IT 제품 전문 리뷰어입니다. 객관적이고 구체적인 리뷰를 한국어로 작성합니다. 실제 사용 경험에 기반한 것처럼 자연스럽게 작성하되, 스펙 데이터를 정확히 반영하세요.',
    userPromptTemplate:
      '다음 제품의 상세 리뷰를 작성해줘.\n\n제품명: {{maker}} {{model}}\nCPU: {{cpu}}\nRAM: {{ram}}\nStorage: {{storage}}\nGPU: {{gpu}}\n화면: {{display_size}}인치\n무게: {{weight}}kg\nOS: {{os}}\n가격: {{price}}원\n\n500자 이상의 리뷰를 작성하고, 장점 3개, 단점 2개, 추천 대상, 비추천 대상을 포함해줘.',
    temperature: 0.7,
    model: 'claude',
    version: '1.0.0',
  },
  {
    name: 'generate-comparison',
    systemPromptTemplate:
      '당신은 한국의 IT 제품 비교 전문가입니다. 두 제품을 객관적으로 비교 분석합니다.',
    userPromptTemplate:
      '다음 두 {{category}} 제품을 비교 분석해줘.\n\n제품 A: {{productA}}\n제품 B: {{productB}}\n\n각 항목별(성능, 디스플레이, 휴대성, 가성비) 비교와 최종 추천을 포함해줘.',
    temperature: 0.7,
    model: 'claude',
    version: '1.0.0',
  },
];

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

  // 4. Seed AI skills
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
