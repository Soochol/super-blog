import { ProductSpecs } from '../../product/domain/ProductSpecs';

export interface CategoryRule {
    categoryId: string;
    name: string; // e.g. "초경량 노트북"
    maxWeight?: number;
    minPrice?: number;
    maxPrice?: number;
    requiredGpuFamily?: string[]; // e.g. ["RTX", "GTX"]
}

export function isEligibleForCategory(rule: CategoryRule, specs: ProductSpecs): boolean {
    if (rule.maxWeight !== undefined && specs.weight > rule.maxWeight) return false;
    if (rule.minPrice !== undefined && specs.price < rule.minPrice) return false;
    if (rule.maxPrice !== undefined && specs.price > rule.maxPrice) return false;

    if (rule.requiredGpuFamily && rule.requiredGpuFamily.length > 0) {
        const hasGpu = rule.requiredGpuFamily.some(gpu => specs.gpu.includes(gpu));
        if (!hasGpu) return false;
    }

    return true;
}
