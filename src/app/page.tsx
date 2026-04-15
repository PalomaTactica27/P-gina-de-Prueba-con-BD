import { ProductManager } from "@/components/ProductManager";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-br from-[#0F357B] via-[#4426C6] to-[#9028ED]">
      <header className="border-b border-white/10 bg-[#0F357B]/50 px-6 py-6 text-center backdrop-blur-md">
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm md:text-4xl">
          Quiz³
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-8">
        <ProductManager />
      </main>

      <footer className="mt-auto border-t border-white/10 bg-[#000000]/30 px-6 py-5 text-center text-sm text-[#D2AEF6] backdrop-blur-md">
        <p className="font-medium text-white">Brizuela Araujo Héctor Alejandro</p>
        <p className="mt-1 text-[#D2AEF6]">6CPGM</p>
      </footer>
    </div>
  );
}
