"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import type { Product } from "@/types/product";
import { supabase } from "@/lib/supabase/client";

const PRICE_STEP = 0.01;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Solo dígitos y un separador decimal; máximo 2 decimales (coma o punto). */
function sanitizeMoneyInput(raw: string): string {
  let t = raw.replace(",", ".");
  t = t.replace(/[^\d.]/g, "");
  const dot = t.indexOf(".");
  if (dot !== -1) {
    const intPart = t.slice(0, dot + 1);
    const frac = t.slice(dot + 1).replace(/\./g, "");
    t = intPart + frac.slice(0, 2);
  }
  return t;
}

function parseMoneyString(s: string): number {
  const n = Number.parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
}

export function ProductManager() {
  const nameId = useId();
  const descId = useId();
  const priceId = useId();

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMsg("No se pudieron cargar los productos.");
        setLoading(false);
        return;
      }

      const normalized: Product[] = (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? "",
        price: Number(p.price),
      }));
      setProducts(normalized);
      setLoading(false);
    };

    void loadProducts();
  }, []);

  const addProduct = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmedName = name.trim();
      const trimmedDesc = description.trim();
      const price = parseMoneyString(priceStr.trim());

      if (!trimmedName || Number.isNaN(price) || price < 0) {
        return;
      }

      setErrorMsg("");

      const { data, error } = await supabase
        .from("products")
        .insert({
          name: trimmedName,
          description: trimmedDesc,
          price: roundMoney(price),
        })
        .select("id, name, description, price")
        .single();

      if (error || !data) {
        setErrorMsg("No se pudo guardar el producto.");
        return;
      }

      const inserted: Product = {
        id: data.id,
        name: data.name,
        description: data.description ?? "",
        price: Number(data.price),
      };
      setProducts((prev) => [inserted, ...prev]);
      setName("");
      setDescription("");
      setPriceStr("");
    },
    [name, description, priceStr]
  );

  const bumpPrice = useCallback((delta: number) => {
    setPriceStr((prev) => {
      const base = parseMoneyString(prev.trim());
      const safe = Number.isNaN(base) ? 0 : base;
      const next = roundMoney(Math.max(0, safe + delta));
      return next.toFixed(2);
    });
  }, []);

  const count = products.length;

  return (
    <div className="grid flex-1 gap-8 lg:grid-cols-2 lg:gap-10">
      <section className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-xl shadow-[#0F357B]/20 backdrop-blur-sm">
        <h2 className="mb-6 text-lg font-semibold text-[#0F357B]">
          Alta de producto
        </h2>
        <form onSubmit={addProduct} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor={nameId} className="text-sm font-medium text-[#4426C6]">
              Nombre del producto
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
              placeholder="Ej. Auriculares Bluetooth"
              className="rounded-xl border border-[#D2AEF6] bg-white px-4 py-3 text-[#0F357B] outline-none ring-[#7C31EA]/30 transition focus:border-[#7C31EA] focus:ring-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={descId} className="text-sm font-medium text-[#4426C6]">
              Detalle o descripción
            </label>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Características, notas…"
              className="resize-y rounded-xl border border-[#D2AEF6] bg-white px-4 py-3 text-[#0F357B] outline-none ring-[#7C31EA]/30 transition focus:border-[#7C31EA] focus:ring-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={priceId} className="text-sm font-medium text-[#4426C6]">
              Precio
            </label>
            <div className="flex rounded-xl border border-[#D2AEF6] bg-white ring-[#7C31EA]/30 transition focus-within:border-[#7C31EA] focus-within:ring-2">
              <span
                className="flex shrink-0 items-center border-r border-[#D2AEF6] bg-[#D2AEF6]/35 px-3 text-base font-semibold tabular-nums text-[#4426C6]"
                aria-hidden
              >
                $
              </span>
              <input
                id={priceId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={priceStr}
                onChange={(e) => setPriceStr(sanitizeMoneyInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey || e.altKey) return;
                  const nav = [
                    "Backspace",
                    "Tab",
                    "Enter",
                    "Escape",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "ArrowUp",
                    "ArrowDown",
                    "Home",
                    "End",
                  ];
                  if (nav.includes(e.key)) return;
                  if (/^\d$/.test(e.key)) return;
                  if (e.key === "." || e.key === ",") {
                    const cur = priceStr.replace(",", ".");
                    if (!cur.includes(".")) return;
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                }}
                required
                placeholder="0,00"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-3 pr-2 font-medium tabular-nums text-[#0F357B] outline-none"
              />
              <div
                className="flex shrink-0 flex-col border-l border-[#D2AEF6]"
                role="group"
                aria-label="Ajustar precio"
              >
                <button
                  type="button"
                  onClick={() => bumpPrice(PRICE_STEP)}
                  className="flex flex-1 items-center justify-center border-b border-[#D2AEF6] px-2.5 text-[#4426C6] transition hover:bg-[#D2AEF6]/40 active:bg-[#D2AEF6]/60"
                  aria-label="Aumentar precio"
                >
                  <span className="text-xs leading-none" aria-hidden>
                    ▲
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => bumpPrice(-PRICE_STEP)}
                  className="flex flex-1 items-center justify-center px-2.5 text-[#4426C6] transition hover:bg-[#D2AEF6]/40 active:bg-[#D2AEF6]/60"
                  aria-label="Disminuir precio"
                >
                  <span className="text-xs leading-none" aria-hidden>
                    ▼
                  </span>
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="mt-2 rounded-xl bg-gradient-to-r from-[#4426C6] via-[#784AC6] to-[#9028ED] px-5 py-3.5 font-semibold text-white shadow-lg shadow-[#4426C6]/35 transition hover:brightness-110 active:scale-[0.99]"
          >
            Agregar producto
          </button>
        </form>
      </section>

      <section className="flex flex-col rounded-2xl border border-white/10 bg-[#0F357B]/40 p-6 shadow-xl backdrop-blur-md">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#D2AEF6]/30 pb-4">
          <h2 className="text-lg font-semibold text-white">Productos registrados</h2>
          <p className="text-sm text-[#D2AEF6]">
            <span className="font-semibold text-white">{count}</span>
            {count === 1 ? " producto" : " productos"}
          </p>
        </div>

        {errorMsg ? <p className="mb-3 text-sm text-red-200">{errorMsg}</p> : null}

        {loading ? (
          <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#7C31EA]/50 bg-[#0F357B]/30 px-4 py-12 text-center text-[#D2AEF6]">
            Cargando productos...
          </p>
        ) : count === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#7C31EA]/50 bg-[#0F357B]/30 px-4 py-12 text-center text-[#D2AEF6]">
            Aún no hay productos. Completa el formulario y pulsa &quot;Agregar producto&quot;.
          </p>
        ) : (
          <ul className="flex max-h-[min(60vh,520px)] flex-col gap-3 overflow-y-auto pr-1">
            {products.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-[#D2AEF6]/25 bg-gradient-to-br from-white/95 to-[#D2AEF6]/30 p-4 shadow-md"
              >
                <p className="font-semibold text-[#0F357B]">{p.name}</p>
                {p.description ? (
                  <p className="mt-1 text-sm text-[#4426C6]/90">{p.description}</p>
                ) : null}
                <p className="mt-3 text-lg font-bold text-[#784AC6]">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 2,
                  }).format(p.price)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
