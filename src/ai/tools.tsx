import { tool as createTool } from "ai";
import { z } from "zod";

// export const recommendProduct = createTool({
//     name: "recommend_product",
//     description: "Recommends a product to the user. Provide details like name, description, image URL, price, store, and link.",
    
// })

export const weatherTool = createTool({
    description: "Get the weather in a location",
    parameters: z.object({
        location: z.string().describe("The location to get the weather for"),
    }),
    execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10, // Random number (62 ~ 92)
    }),
});

export const recommendProductTool = createTool({
    description: "Recommend a product to the user. If you do find a product, do NOT return product details and instead pass it on to the tool.",
    parameters: z.object({
        product: z.string().describe("The product to recommend"),
    }),
    execute: async ({ product }) => ({
        product,
        image: "https://placehold.co/150",
        price: Math.floor(Math.random() * 100),
        store: "Example Store",
        link: "https://www.example.com/product/" + product,
    }),
});

export const tools = {
    displayWeather: weatherTool,
    recommendProduct: recommendProductTool,
}