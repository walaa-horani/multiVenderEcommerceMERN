"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Star, ShoppingCart, Plus, Minus, ArrowLeft, Package, Shield, Truck } from "lucide-react";
import { Product } from "../../data/products";
import { useApp } from "../../contexts/AppContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { ProductCard } from "../../components/ProductCard";

export default function ProductDetails() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`);
        const data = await res.json();
        setProduct(data);

        const allRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
        const allData = await allRes.json();
        setRelatedProducts(
          allData.filter((p: Product) => p.category === data.category && p._id !== data._id).slice(0, 4)
        );
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2>Loading product...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="mb-4">Product not found</h2>
        <Link href="/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    router.push("/cart");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Image */}
        <div className="aspect-square rounded-lg overflow-hidden bg-secondary/20">
          <ImageWithFallback
            src={product.images && product.images.length > 0 ? product.images[0] : "/placeholder.jpg"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div>
          <Badge className="mb-4">{product.category}</Badge>
          <h1 className="mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < Math.floor(product.rating || 0)
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-gray-600"
                    }`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">
              {product.rating || 0} ({product.reviews || 0} reviews)
            </span>
          </div>

          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-4xl font-bold text-primary">
              ${product.price}
            </span>
            {product.stock < 20 && product.stock > 0 && (
              <Badge variant="destructive">Only {product.stock} left!</Badge>
            )}
          </div>

          <p className="text-lg mb-8 text-muted-foreground">
            {product.description}
          </p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span>In Stock: {product.stock} units available</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>30-day return policy</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="flex-1"
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Vendor: {product.vendorId?.storeName}</p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
