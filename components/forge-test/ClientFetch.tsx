"use client";

import { useEffect, useState } from "react";

import { fetchDummy } from "@/lib/forge-test/dummy-api";

import { Section, Unavailable } from "./Section";

type Product = { id: number; title: string; price: number };
type State =
  | { status: "loading" }
  | { status: "ready"; products: Product[] }
  | { status: "unavailable" };

// Fetches in the browser after the page has hydrated, so the first HTML only
// holds the loading state. The data never passes through our server.
export function ClientFetch() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // Ignores an answer that arrives after the section left the page.
    let active = true;
    fetchDummy<{ products: Product[] }>(
      "/products?limit=4&select=title,price",
    ).then((result) => {
      if (!active) return;
      setState(
        result.ok
          ? { status: "ready", products: result.data.products }
          : { status: "unavailable" },
      );
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Section
      id="products"
      rendering="client-fetch"
      title="Products"
      state={state.status}
    >
      {state.status === "loading" && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading products...
        </p>
      )}
      {state.status === "unavailable" && <Unavailable />}
      {state.status === "ready" && (
        <ul className="divide-y divide-border">
          {state.products.map((product) => (
            <li key={product.id} className="py-2 text-sm">
              {product.title}
              <span className="ml-2 text-muted-foreground">
                ${product.price}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
