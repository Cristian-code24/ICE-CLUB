"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (product: Omit<CartItem, "quantity">) => void;
  syncCatalog: (products: Array<Pick<CartItem, "id" | "name" | "price">>) => void;
  changeQuantity: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);
          return {
            items: existing
              ? state.items.map((item) =>
                  item.id === product.id
                    ? {
                        ...item,
                        name: product.name,
                        price: product.price,
                        quantity: item.quantity + 1,
                      }
                    : item,
                )
              : [...state.items, { ...product, quantity: 1 }],
          };
        }),
      syncCatalog: (products) =>
        set((state) => {
          const catalog = new Map<
            string,
            Pick<CartItem, "id" | "name" | "price">
          >();
          for (const product of products) catalog.set(product.id, product);
          let changed = false;
          const items = state.items.map((item) => {
            const product = catalog.get(item.id);
            if (
              !product ||
              (item.name === product.name && item.price === product.price)
            ) {
              return item;
            }
            changed = true;
            return { ...item, name: product.name, price: product.price };
          });
          return changed ? { items } : state;
        }),
      changeQuantity: (id, delta) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id
                ? { ...item, quantity: item.quantity + delta }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "ice-club-cart" },
  ),
);
