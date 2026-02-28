import { getCategories, getCategoryById, getProductsByCategory, getProductById, getReviewByProductId } from '@/lib/api';
import { prisma } from '@/infrastructure/db/PrismaClient';

// Integration tests — require seeded DB

afterAll(async () => {
  await prisma.$disconnect();
});

describe('api (Prisma)', () => {
  test('getCategories returns all categories', async () => {
    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty('id');
    expect(categories[0]).toHaveProperty('name');
    expect(categories[0]).toHaveProperty('description');
  });

  test('getCategoryById returns correct category', async () => {
    const category = await getCategoryById('laptop');
    expect(category).toBeDefined();
    expect(category!.name).toBe('노트북');
  });

  test('getProductsByCategory returns products with nested specs', async () => {
    const products = await getProductsByCategory('laptop');
    expect(products.length).toBe(3);
    const product = products[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('brand');
    expect(product).toHaveProperty('specs');
    expect(product.specs).toHaveProperty('cpu');
    expect(product.specs).toHaveProperty('display');
    expect(typeof product.specs.weight).toBe('number');
  });

  test('getProductById returns single product by slug', async () => {
    const product = await getProductById('macbook-pro-16');
    expect(product).toBeDefined();
    expect(product!.brand).toBe('Apple');
  });

  test('getReviewByProductId returns review by product slug', async () => {
    const review = await getReviewByProductId('macbook-pro-16');
    expect(review).toBeDefined();
    expect(review!.rating).toBe(4.8);
    expect(review!.pros.length).toBeGreaterThan(0);
  });
});
