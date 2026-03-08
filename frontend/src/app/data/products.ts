export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  featured: boolean;
  stock: number;
  vendorId: {
    _id: string;
    storeName: string;
  };
  rating: number;
  reviews: number;
}

export const categories = ["All", "Electronics", "Fashion", "Sports", "Home & Kitchen"];