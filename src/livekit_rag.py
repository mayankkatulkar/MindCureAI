from dotenv import load_dotenv
from llama_index.core import (
    SimpleDirectoryReader,
    StorageContext,
    VectorStoreIndex,
    load_index_from_storage,
    Settings,
)
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from pathlib import Path
import logging
import os

logger = logging.getLogger("livekit_rag")

# Load environment variables from the correct path
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

# Configure LlamaIndex to use native Gemini models
Settings.llm = GoogleGenAI(
    model="models/gemini-1.5-flash",
    api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7,
)

Settings.embed_model = GoogleGenAIEmbedding(
    model="models/text-embedding-004",
    api_key=os.getenv("GOOGLE_API_KEY"),
)

# RAG with Livekit
# check if storage already exists
THIS_DIR = Path(__file__).parent
PERSIST_DIR = THIS_DIR / "query-engine-storage"


# check if data directory exists
if not (THIS_DIR / "data").exists():
    logger.error("Data directory does not exist")

    # create empty data directory
    (THIS_DIR / "data").mkdir(parents=True, exist_ok=True)


if not PERSIST_DIR.exists():
    # load the documents and create the index
    documents = SimpleDirectoryReader(THIS_DIR / "data").load_data()
    index = VectorStoreIndex.from_documents(documents)
    # store it for later
    index.storage_context.persist(persist_dir=PERSIST_DIR)
else:
    # load the existing index
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    index = load_index_from_storage(storage_context)


async def livekit_rag(query: str):
    logger.info(f"Querying info for {query}")
    query_engine = index.as_query_engine(use_async=True)
    res = await query_engine.aquery(query)
    return str(res)



