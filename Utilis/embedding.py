from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-m3", device="cuda")


def sentence_embedding(text):
    return model.encode(text)


if __name__ == "__main__":
    print(sentence_embedding("Hello"))