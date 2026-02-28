import categoriesData from '../data/categories.json';
import productsData from '../data/products.json';
import reviewsData from '../data/reviews.json';
import { Category, Product, Review } from '../types';

export const getCategories = async (): Promise<Category[]> => {
    return categoriesData as Category[];
};

export const getCategoryById = async (id: string): Promise<Category | undefined> => {
    return (categoriesData as Category[]).find(c => c.id === id);
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
    return (productsData as Product[]).filter(p => p.categoryId === categoryId);
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    return (productsData as Product[]).find(p => p.id === id);
};

export const getReviewByProductId = async (productId: string): Promise<Review | undefined> => {
    return (reviewsData as Review[]).find(r => r.productId === productId);
};
