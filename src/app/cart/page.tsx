"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import ProductImage from "@/components/ProductImage";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    itemCount,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-500">
              Shopping Cart
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Your Cart</h1>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-3xl text-orange-600">
              🛒
            </div>

            <h2 className="mt-6 text-2xl font-black">Your cart is empty</h2>
            <p className="mt-2 text-slate-500">
              Add some quality mobile parts to continue shopping.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-xl bg-orange-500 px-7 py-3 font-black text-white transition hover:bg-orange-600"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-500">
            Shopping Cart
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Your Cart</h1>
          <p className="mt-2 text-slate-500">
            {itemCount} item{itemCount !== 1 ? "s" : ""} in your cart
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="relative h-28 w-full overflow-hidden rounded-xl sm:w-28">
                    <ProductImage
                      src={item.product.image}
                      alt={item.product.name}
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                          {item.product.category}
                        </div>
                        <h2 className="mt-1 text-lg font-black text-slate-900">
                          {item.product.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.product.brand} · {item.product.model} · {item.product.quality}
                        </p>
                      </div>

                      <div className="text-lg font-black text-slate-900">
                        Rs. {(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-10 w-10 font-black text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                        >
                          -
                        </button>

                        <div className="flex h-10 w-12 items-center justify-center border-x border-slate-200 bg-white font-black text-slate-900">
                          {item.quantity}
                        </div>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="h-10 w-10 font-black text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-sm font-bold text-red-500 transition hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Order Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">Rs. {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className="text-right font-bold text-slate-900">Calculated by city and area at checkout</span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span className="font-black text-slate-900">
                    Subtotal before delivery
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Enter your delivery city and area at checkout to see the applicable rate. Store pickup has no delivery charge.
                </p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-7 block rounded-xl bg-orange-500 px-6 py-4 text-center font-black text-white transition hover:bg-orange-600"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/"
              className="mt-3 block text-center text-sm font-bold text-slate-500 transition hover:text-orange-600"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
