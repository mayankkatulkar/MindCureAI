#!/usr/bin/env python3
"""
Script to recreate RAG embeddings after file uploads.
This script deletes the existing query-engine-storage and recreates it with new documents.
"""

import shutil
from dotenv import load_dotenv
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    Settings,
)
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from pathlib import Path
import logging
import os

# Set up logging
logger = logging.getLogger("recreate_rag")

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


def recreate_rag_embeddings():
    """
    Delete existing query-engine-storage and recreate RAG embeddings from data folder.
    """
    try:
        logger.info("=== RAG RECREATION FUNCTION CALLED ===")
        logger.info("Starting RAG recreation process...")

        # Define paths
        THIS_DIR = Path(__file__).parent
        PERSIST_DIR = THIS_DIR / "query-engine-storage"
        DATA_DIR = THIS_DIR / "data"

        logger.info(f"Working directory: {THIS_DIR}")
        logger.info(f"Data directory: {DATA_DIR}")
        logger.info(f"Storage directory: {PERSIST_DIR}")

        # Check if data directory exists and has files
        if not DATA_DIR.exists():
            logger.warning(f"Data directory {DATA_DIR} does not exist!")
            return False

        data_files = list(DATA_DIR.glob("*"))
        logger.info(f"Found {len(data_files)} files in data directory")
        for file in data_files:
            logger.info(f"  - {file.name}")

        # Delete existing query-engine-storage directory
        if PERSIST_DIR.exists():
            logger.info(f"Deleting existing storage at {PERSIST_DIR}")
            shutil.rmtree(PERSIST_DIR)
            logger.info("Existing storage deleted successfully")
        else:
            logger.info("No existing storage found, creating new one")

        # Create storage directory if it doesn't exist
        PERSIST_DIR.mkdir(exist_ok=True)
        logger.info(f"Storage directory ready: {PERSIST_DIR}")

        # load the documents and create the index
        logger.info("Loading documents from data directory...")
        documents = SimpleDirectoryReader(DATA_DIR).load_data()
        logger.info(f"Loaded {len(documents)} documents")

        logger.info("Creating vector index...")
        index = VectorStoreIndex.from_documents(documents)
        logger.info("Vector index created successfully")

        # store it for later
        logger.info("Persisting index to storage...")
        index.storage_context.persist(persist_dir=PERSIST_DIR)
        logger.info("Index persisted successfully")

        logger.info("=== RAG RECREATION COMPLETED SUCCESSFULLY ===")
        return True

    except Exception as e:
        logger.error(f"=== ERROR DURING RAG RECREATION ===")
        logger.error(f"Error during RAG recreation: {e}")
        import traceback

        logger.error(f"Traceback: {traceback.format_exc()}")
        return False


if __name__ == "__main__":
    print("=== RECREATE RAG SCRIPT STARTED ===")
    success = recreate_rag_embeddings()
    if success:
        print("=== SCRIPT COMPLETED SUCCESSFULLY ===")
    else:
        print("=== SCRIPT FAILED ===")
        exit(1)
