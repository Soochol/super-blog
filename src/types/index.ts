export interface Category {
    id: string;
    name: string;
    description: string;
}

export interface ProductSpec {
    cpu: string;
    ram: string;
    storage: string;
    gpu: string;
    display: string;
    weight: number;
    os: string;
}

export interface Product {
    id: string;
    categoryId: string;
    name: string;
    price: number;
    brand: string;
    specs: ProductSpec;
    imageUrl: string;
    couponUrl?: string;
}

export interface Review {
    productId: string;
    summary: string;
    pros: string[];
    cons: string[];
    rating: number;
}
