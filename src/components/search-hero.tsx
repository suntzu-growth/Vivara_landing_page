export function SearchHero() {
    return (
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto py-12 md:pb-8 md:pt-20 space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <img
                src="/vivara-logo.png"
                alt="Vivara"
                className="h-24 md:h-36 w-auto"
            />
            <p className="text-sm md:text-base text-gray-700 font-sans max-w-xl mx-auto leading-relaxed px-4">
                Encuentra y disfruta tu nuevo hogar con Vivara<br />
                Simplificamos el proceso de alquiler para que te concentres en lo que realmente importa: disfrutar de tu casa.
            </p>
        </div>
    );
}

