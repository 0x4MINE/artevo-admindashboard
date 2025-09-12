import { ReturnProduct, ReturnService } from "@/types/return";

export const validateReturnQuantities = (products: ReturnProduct[]): boolean => {
  return products.every(
    (product) =>
      product.return_quantity >= 0 &&
      product.return_quantity <= product.original_quantity
  );
};

export const calculateReturnTotal = (
  products: ReturnProduct[],
  services: ReturnService[]
): number => {
  const productTotal = products.reduce(
    (sum, product) => sum + product.buyPrice * product.return_quantity,
    0
  );
  
  const serviceTotal = services.reduce(
    (sum, service) => sum + service.buyPrice,
    0
  );
  
  return productTotal + serviceTotal;
};

export const hasItemsToReturn = (
  products: ReturnProduct[],
  services: ReturnService[]
): boolean => {
  const hasProducts = products.some((product) => product.return_quantity > 0);
  const hasServices = services.some((service) => service.return_reason.trim() !== "");
  
  return hasProducts || hasServices;
};