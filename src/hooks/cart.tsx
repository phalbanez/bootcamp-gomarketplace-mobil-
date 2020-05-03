import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (storedProducts) setProducts(JSON.parse(storedProducts));
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(p => {
        const product = p;
        if (product.id === id) product.quantity += 1;

        return product;
      });

      setProducts(newProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const searchProduct = products.find(p => p.id === product.id);

      if (searchProduct) {
        increment(searchProduct.id);
      } else {
        setProducts(oldProducts => [
          ...oldProducts,
          { ...product, quantity: 1 },
        ]);
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(p => {
        const product = p;
        if (product.id === id && product.quantity > 1) product.quantity -= 1;

        return product;
      });

      setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
