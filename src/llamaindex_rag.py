from pathlib import Path
from dotenv import load_dotenv
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
    Settings,
)
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from llama_index.core.agent.workflow import FunctionAgent
from utils import get_doc_tools
import logging
import os

# Load environment variables from the correct path
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

# Configure LlamaIndex to use native Gemini models
Settings.llm = GoogleGenAI(
    model="gemini-2.0-flash",
    api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7,
)

Settings.embed_model = GoogleGenAIEmbedding(
    model="text-embedding-004",
    api_key=os.getenv("GOOGLE_API_KEY"),
)

# Configuration
THIS_DIR = Path(__file__).parent
DATA_DIR = THIS_DIR / "data"  # or "src/data" based on your structure
PERSIST_DIR = THIS_DIR / "query-engine-storage"


def setup_persistent_index():
    """Set up or load the persistent vector index."""
    if not PERSIST_DIR.exists():
        logger.info("Creating new vector index...")

        # Check if data directory exists and has files
        if not DATA_DIR.exists():
            logger.warning(
                f"Data directory {DATA_DIR} does not exist. Creating empty index."
            )
            # Create an empty index
            index = VectorStoreIndex.from_documents([])
            index.storage_context.persist(persist_dir=PERSIST_DIR)
            logger.info(f"Empty index created and persisted to {PERSIST_DIR}")
            return index

        # Check if data directory is empty
        data_files = list(DATA_DIR.iterdir())
        if not data_files:
            logger.warning(f"Data directory {DATA_DIR} is empty. Creating empty index.")
            # Create an empty index
            index = VectorStoreIndex.from_documents([])
            index.storage_context.persist(persist_dir=PERSIST_DIR)
            logger.info(f"Empty index created and persisted to {PERSIST_DIR}")
            return index

        # Load documents and create index
        documents = SimpleDirectoryReader(DATA_DIR).load_data()
        index = VectorStoreIndex.from_documents(documents)
        # Persist for later use
        index.storage_context.persist(persist_dir=PERSIST_DIR)
        logger.info(f"Index created and persisted to {PERSIST_DIR}")
    else:
        logger.info("Loading existing vector index...")
        # Load existing index
        storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
        index = load_index_from_storage(storage_context)
        logger.info("Index loaded successfully")

    return index


def create_file_specific_tools():
    """Create vector and summary tools for each file."""
    file_to_tools_dict = {}

    if not DATA_DIR.exists():
        logger.warning(f"Data directory {DATA_DIR} does not exist")
        return {}, []

    # Check if data directory is empty
    data_files = list(DATA_DIR.iterdir())
    if not data_files:
        logger.warning(
            f"Data directory {DATA_DIR} is empty. No file-specific tools will be created."
        )
        return {}, []

    for file in DATA_DIR.iterdir():
        if file.is_file():  # Only process files, not directories
            logger.info(f"Getting tools for file: {file}")
            try:
                vector_tool, summary_tool = get_doc_tools(file, file.stem)
                file_to_tools_dict[file] = [vector_tool, summary_tool]
            except Exception as e:
                logger.error(f"Error creating tools for {file}: {e}")

    # Flatten tools list
    initial_tools = [
        tool for tools_list in file_to_tools_dict.values() for tool in tools_list
    ]

    logger.info(
        f"Created {len(initial_tools)} tools from {len(file_to_tools_dict)} files"
    )
    return file_to_tools_dict, initial_tools


def create_index_query_tool(index):
    """Create a query tool from the persistent index."""
    from llama_index.core.tools import QueryEngineTool

    query_engine = index.as_query_engine()

    # Create a tool that can query the entire index
    index_tool = QueryEngineTool.from_defaults(
        query_engine=query_engine,
        name="query_all_documents",
        description="Query across all documents in the knowledge base. Use this for broad questions that might span multiple documents.",
    )

    return index_tool


def setup_combined_agent():
    """Set up the agent with both persistent index and file-specific tools (FunctionAgent)."""

    # Step 1: Set up persistent index
    index = setup_persistent_index()

    # Step 2: Create file-specific tools
    file_to_tools_dict, file_specific_tools = create_file_specific_tools()

    # Step 3: Create index query tool
    index_tool = create_index_query_tool(index)

    # Step 4: Combine all tools
    all_tools = [index_tool] + file_specific_tools

    # Step 5: Initialize LLM (uses the global Settings configuration)
    llm = Settings.llm

    # Step 6: Create enhanced system prompt
    system_prompt = """
    You are an intelligent document analysis agent with access to multiple types of tools:
    
    1. A comprehensive query tool that searches across ALL documents
    2. File-specific vector search tools for targeted document queries
    3. File-specific summary tools for document overviews
    
    Strategy for tool usage:
    - Use the 'query_all_documents' tool for broad questions spanning multiple documents
    - Use file-specific vector tools when you need precise information from a particular document
    - Use summary tools to get overviews of specific documents
    - You can combine results from multiple tools to provide comprehensive answers
    
    Always cite which documents or sources your information comes from.
    """

    # Step 7: Create Workflow Agent
    workflow = FunctionAgent(
        tools=all_tools,
        llm=llm,
        system_prompt=system_prompt,
    )

    logger.info(f"FunctionAgent created with {len(all_tools)} total tools")

    return workflow, index, file_to_tools_dict


def update_index_with_new_documents():
    """Update the persistent index when new documents are added."""
    # Load existing index
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    index = load_index_from_storage(storage_context)

    # Check if data directory exists and has files
    if not DATA_DIR.exists():
        logger.warning(
            f"Data directory {DATA_DIR} does not exist. No documents to update."
        )
        return index

    # Check if data directory is empty
    data_files = list(DATA_DIR.iterdir())
    if not data_files:
        logger.warning(f"Data directory {DATA_DIR} is empty. No documents to update.")
        return index

    # Load new documents
    documents = SimpleDirectoryReader(DATA_DIR).load_data()

    # Add new documents to existing index
    for doc in documents:
        index.insert(doc)

    # Persist updated index
    index.storage_context.persist(persist_dir=PERSIST_DIR)

    logger.info("Index updated with new documents")
    return index





# Main execution
if __name__ == "__main__":
    import asyncio

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    # Option 1: Use FunctionAgent (workflow-based, async)
    logger.info("=== Setting up FunctionAgent (Workflow) ===")
    workflow_agent, index, file_tools = setup_combined_agent()

    logger.info(f"Workflow Agent: {workflow_agent}")
    logger.info(f"Index: {index}")
    logger.info(f"File Tools: {file_tools}")

    logger.info("\nAgent is ready! Available tools:")
    for tool in workflow_agent.tools:
        logger.info(f"- {tool.metadata.name}: {tool.metadata.description}")

    # Example queries using the workflow agent (async)
    async def run_workflow_examples():
        try:
            logger.info("\n--- Testing Workflow Agent ---")
            response = await workflow_agent.run(
                "Compare longlora, selfrag and metagpt papers and bring out the key differences and similarities."
            )
            logger.info(f"Workflow Response: {response}")

        except Exception as e:
            logger.info(f"Error during workflow execution: {e}")

    # Uncomment to run workflow examples
    asyncio.run(run_workflow_examples())
