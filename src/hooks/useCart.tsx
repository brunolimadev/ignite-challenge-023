import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
   
      const productAlreadyAdded = cart.find(item => item.id === productId)
      
      if(productAlreadyAdded){
        updateProductAmount({amount: productAlreadyAdded.amount+1, productId})
        return;
      };
      
      const isValidStock = await hasStock(productId, 1)
      if(!isValidStock) return;

      const {data: responseProduct} = await api.get<Product>(`products/${productId}`);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...responseProduct, amount: 1}]));

      setCart([...cart, {...responseProduct, amount: 1}])

    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productFounded = cart.find(product => product.id === productId);
      if(!productFounded){
        toast.error('Erro na remoção do produto');
        return;
      };

      const filtereddItems = cart.filter(item => item.id !== productId)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filtereddItems));
      setCart(filtereddItems)

    } catch (err: any){
      // TODO
      toast.error(err);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      const productFounded = cart.find(product => product.id === productId);

      if(amount < 1 || !productFounded){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const isValidStock = await hasStock(productId, amount)
      if(!isValidStock) return;

      const newCart = cart.map(item => {
        if(item.id === productId){
          item.amount = amount
        }
        return item;
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart)

    } catch (err: any){
      // TODO
      toast.error(err);
    }
  };

  async function hasStock(productId: number, amount: number): Promise<boolean>{
    
    const {data: responseStock} = await api.get<Stock>(`stock/${productId}`);

    const product = cart.find(item => item.id === productId)

    if(product && responseStock.amount < amount){
      toast.error('Quantidade solicitada fora de estoque');
      return false
    }

    return true;
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
