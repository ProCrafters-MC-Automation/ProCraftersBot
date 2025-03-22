import { pipeline } from "@huggingface/transformers";

let context_length = 5
let end_message = "Leave."

// Testing
// let user_message1 = "Hi."
// let user_message2 = "How are you?"
// let user_message3 = "What's your name?"
// let user_message4 = "What's your favorite color?"
// let user_message5 = "What's your favorite animal?"
// let user_message6 = "What's your favorite food?"

// Create a text generation pipeline
const generator = await pipeline(
    "text-generation",
    "HuggingFaceTB/SmolLM2-135M-Instruct",
);

// Define the list of messages
let messages = [
    { role: "system", content: "You are a helpful assistant." },
];

async function generate_message(user_message) {
    messages.push({ role: "user", content: user_message })
    // Generate a response
    let output = await generator(messages, { max_new_tokens: 128 });
    let bot_response = output[0].generated_text.at(-1).content
    // console.log(bot_response)
    messages.push({ role: "assistant", content: bot_response })

    return bot_response
}

// await generate_message(user_message1)
// await generate_message(user_message2)
// await generate_message(user_message3)
// await generate_message(user_message4)
// await generate_message(user_message5)
// await generate_message(user_message6)

console.log(messages)
