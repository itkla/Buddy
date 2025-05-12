type ProductRecommendationProps = {
    image: string;
    product: string;
    price: number;
    store: string;
    link: string;
}

export const ProductRecommendation = ({ image, product, price, store, link }: ProductRecommendationProps) => {
    return (
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden max-w-md">
            <div className="relative h-48 overflow-hidden">
                <img src={image} alt={product} className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
            </div>
            <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{product}</h3>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${price.toFixed(2)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Available at {store}</p>
                <a 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-3 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                    Buy now
                </a>
            </div>
        </div>
    )
}
