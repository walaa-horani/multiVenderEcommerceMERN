import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { Product } from "../data/products";
import { useApp } from "../contexts/AppContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useApp();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <Link href={`/products/${product._id}`}>
      <Card className="group overflow-hidden hover:border-primary transition-all duration-300 h-full flex flex-col">
        <div className="relative overflow-hidden aspect-square">
          <ImageWithFallback
            src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-primary">Featured</Badge>
          )}
          {product.stock < 20 && product.stock > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Only {product.stock} left
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex-grow">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">{product.category}</Badge>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.reviews})</span>
            </div>
          </div>
          <h3 className="mb-2 line-clamp-2">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ${product.price}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};
