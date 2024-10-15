# generate_response.py
import sys
from transformers import AutoTokenizer, AutoModelForCausalLM

def main():
    if len(sys.argv) < 2:
        print("No input provided.")
        return

    user_input = sys.argv[1]

    # Initialize the model and tokenizer
    tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-small")
    model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-small")

    # Encode the input and generate a response
    inputs = tokenizer.encode(user_input + tokenizer.eos_token, return_tensors='pt')
    reply_ids = model.generate(inputs, max_length=1000, pad_token_id=tokenizer.eos_token_id)
    reply = tokenizer.decode(reply_ids[:, inputs.shape[-1]:][0], skip_special_tokens=True)

    print(reply)

if __name__ == "__main__":
    main()
