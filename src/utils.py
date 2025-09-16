# TODO: abstract all of this into a function that takes in a PDF file name

from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, SummaryIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.tools import FunctionTool, QueryEngineTool
from llama_index.core.vector_stores import MetadataFilters, FilterCondition
from typing import List, Optional


def get_doc_tools(
    file_path: str,
    name: str,
) -> str:
    """Get vector query and summary query tools from a document."""

    # load documents
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
    splitter = SentenceSplitter(chunk_size=1024)
    nodes = splitter.get_nodes_from_documents(documents)
    vector_index = VectorStoreIndex(nodes)

    def vector_query(query: str, page_numbers: Optional[List[str]] = None) -> str:
        """Use to answer questions over a given paper.

        Useful if you have specific questions over the paper.
        Always leave page_numbers as None UNLESS there is a specific page you want to search for.

        Args:
            query (str): the string query to be embedded.
            page_numbers (Optional[List[str]]): Filter by set of pages. Leave as NONE
                if we want to perform a vector search
                over all pages. Otherwise, filter by the set of specified pages.

        """

        page_numbers = page_numbers or []
        metadata_dicts = [{"key": "page_label", "value": p} for p in page_numbers]

        query_engine = vector_index.as_query_engine(
            similarity_top_k=2,
            filters=MetadataFilters.from_dicts(
                metadata_dicts, condition=FilterCondition.OR
            ),
        )
        response = query_engine.query(query)
        return response

    # Create a shorter, sanitized name for the tool
    # Remove special characters and limit length to ensure it fits within 64 chars
    sanitized_name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_"))[
        :30
    ]
    sanitized_name = sanitized_name.replace(" ", "_").lower()

    vector_query_tool = FunctionTool.from_defaults(
        name=f"vector_{sanitized_name}", fn=vector_query
    )

    summary_index = SummaryIndex(nodes)
    summary_query_engine = summary_index.as_query_engine(
        response_mode="tree_summarize",
        use_async=True,
    )
    summary_tool = QueryEngineTool.from_defaults(
        name=f"summary_{sanitized_name}",
        query_engine=summary_query_engine,
        description=(f"Useful for summarization questions related to {name}"),
    )

    return vector_query_tool, summary_tool
