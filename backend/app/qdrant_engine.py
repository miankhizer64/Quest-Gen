from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document
from langchain_community.vectorstores import Qdrant
from langchain_community.document_loaders import PDFMinerLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains.question_answering import load_qa_chain
from langchain.chains.qa_with_sources import load_qa_with_sources_chain
from langchain_openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, Filter
from qdrant_client.http import models as rest
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union
from config import settings
import uuid
import logging
import os
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
from tenacity import retry, wait_exponential, stop_after_attempt
import multiprocessing as mp
from functools import partial
import json
import re
import base64
import requests
from pathlib import Path

# Logging Configuration
logging.basicConfig(level=logging.INFO, format="=========== %(asctime)s :: %(levelname)s :: %(message)s")

MetadataFilter = Dict[str, Union[str, int, bool]]
COLLECTION_NAME = "PDF_Querier_Enhanced"

qdrant_host = settings.qdrant_host
print("QDRANT HOST" , qdrant_host)
qdrant_api_key = settings.qdrant_api_key
prefer_grpc = False

# Load the embedding model
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

# Enhanced QA Chain with OpenAI for comprehensive responses
qa_chain = load_qa_with_sources_chain(
    llm=ChatOpenAI(
        openai_api_key=settings.openai_api_key, 
        model_name="gpt-4o",  # Using latest GPT model
        temperature=0.3,
        max_tokens=2000
    ),
    chain_type="stuff",
    verbose=False
)

# Multiple LLM instances for different purposes
comprehensive_llm = ChatOpenAI(
    openai_api_key=settings.openai_api_key,
    model_name="gpt-4o",
    temperature=0.2,
    max_tokens=3000
)

formatting_llm = ChatOpenAI(
    openai_api_key=settings.openai_api_key,
    model_name="gpt-4o",
    temperature=0.1,
    max_tokens=2000
)

academic_llm = ChatOpenAI(
    openai_api_key=settings.openai_api_key,
    model_name="gpt-4o",
    temperature=0.4,
    max_tokens=2000
)

# Generic question handler LLM with higher token limit
generic_llm = ChatOpenAI(
    openai_api_key=settings.openai_api_key,
    model_name="gpt-4o",
    temperature=0.3,
    max_tokens=4000
)


class QdrantIndex:
    def __init__(self, qdrant_host: str, qdrant_api_key: str, prefer_grpc: bool):
        """Initialize Qdrant Client with enhanced configuration"""
        if qdrant_host == "localhost":
            self.qdrant_client = QdrantClient(url="http://localhost:6333")
        else:
            self.qdrant_client = QdrantClient(
                host=qdrant_host,
                prefer_grpc=prefer_grpc,
                api_key=qdrant_api_key
            )

        self.embedding_model = embedding_model
        self.embedding_size = 768
        self.collection_name = COLLECTION_NAME
        self.pdf_cache = {}  # Cache for PDF contents
        self.last_updated_pdf = None  # Track the most recently updated PDF
        self.pdf_timestamps = {}  # Track PDF update timestamps

        # Create or Recreate Collection with optimized settings
        try:
            self.qdrant_client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_size, 
                    distance=Distance.COSINE,
                    hnsw_config=rest.HnswConfigDiff(
                        m=16,
                        ef_construct=200
                    )
                ),
                optimizers_config=rest.OptimizersConfigDiff(
                    default_segment_number=4,
                    max_segment_size=20000,
                    memmap_threshold=20000
                )
            )
            logging.info(f"Collection {COLLECTION_NAME} successfully created with optimized settings.")
        except Exception as e:
            logging.error(f"Error creating collection: {str(e)}")
            raise

    def _is_generic_question(self, query: str) -> bool:
        """
        Determine if a question is generic and requires full PDF content
        """
        generic_patterns = [
            # Question generation patterns
            r'generate.*questions?.*(?:from|out of|about).*pdf',
            r'create.*questions?.*(?:from|out of|about).*pdf',
            r'make.*questions?.*(?:from|out of|about).*pdf',
            r'list.*questions?.*(?:from|out of|about).*pdf',
            r'(?:give|show).*questions?.*(?:from|out of|about).*pdf',
            
            # Main topic/content patterns
            r'what.*(?:are|is).*(?:main|key|primary|important).*(?:topics?|subjects?|themes?|points?|ideas?|concepts?)',
            r'what.*(?:are|is).*(?:main|key|primary|important).*(?:questions?|issues?|problems?)',
            r'(?:main|key|primary|important).*(?:topics?|subjects?|themes?|points?|ideas?|concepts?)',
            r'(?:main|key|primary|important).*(?:questions?|issues?|problems?)',
            
            # Summary patterns
            r'summarize.*(?:the|this).*pdf',
            r'(?:give|provide).*summary.*(?:of|about).*pdf',
            r'what.*(?:is|are).*(?:the|this).*pdf.*about',
            r'(?:overview|summary).*(?:of|about).*(?:the|this).*pdf',
            
            # Content analysis patterns
            r'analyze.*(?:the|this).*pdf',
            r'(?:analyze|examine).*(?:content|document)',
            r'what.*(?:does|do).*(?:the|this).*pdf.*(?:discuss|cover|contain)',
            r'(?:content|contents).*(?:of|in).*(?:the|this).*pdf',
            
            # All/everything patterns
            r'(?:all|everything).*(?:about|in).*(?:the|this).*pdf',
            r'(?:complete|full|entire).*(?:content|analysis|overview)',
            
            # Chapter/section patterns
            r'(?:list|show|give).*(?:all|every).*(?:chapters?|sections?|parts?)',
            r'what.*(?:chapters?|sections?|parts?).*(?:are|does).*(?:the|this).*pdf.*(?:have|contain)',
            
            # Research/study patterns
            r'research.*(?:questions?|objectives?|goals?)',
            r'(?:study|research).*(?:focus|aim|purpose)',
            r'(?:objectives?|goals?|aims?).*(?:of|in).*(?:the|this).*(?:study|research|paper)',
            
            # Methodology patterns
            r'(?:methodology|methods?).*(?:used|employed|applied)',
            r'(?:how|what).*(?:methodology|methods?).*(?:was|were).*(?:used|employed)',
            
            # Findings/results patterns
            r'(?:findings|results|conclusions?).*(?:of|in).*(?:the|this).*(?:study|research|paper)',
            r'what.*(?:findings|results|conclusions?).*(?:does|do).*(?:the|this).*(?:study|research|paper)',
            
            # General content patterns
            r'(?:discuss|cover|explain|describe).*(?:in|within).*(?:the|this).*pdf',
            r'what.*(?:is|are).*(?:discussed|covered|explained|described).*(?:in|within).*(?:the|this).*pdf'
        ]
        
        query_lower = query.lower().strip()
        
        # Check against patterns
        for pattern in generic_patterns:
            if re.search(pattern, query_lower):
                return True
        
        # Additional heuristics
        generic_keywords = [
            'summarize', 'overview', 'summary', 'analyze', 'analysis', 'content', 'contents',
            'main points', 'key points', 'important points', 'main topics', 'key topics',
            'main ideas', 'key ideas', 'main concepts', 'key concepts', 'all about',
            'everything about', 'complete analysis', 'full analysis', 'entire content',
            'whole document', 'research questions', 'study objectives', 'research objectives',
            'generate questions', 'create questions', 'make questions', 'list questions'
        ]
        
        # Check if query contains generic keywords
        for keyword in generic_keywords:
            if keyword in query_lower:
                return True
        
        # Check for pattern: "X questions from/about PDF"
        if re.search(r'\d+\s+questions?.*(?:from|about|out of).*pdf', query_lower):
            return True
        
        return False

    def _get_most_recent_pdf_content(self) -> Tuple[str, str]:
        """
        Get the full content of the most recently updated PDF
        """
        if not self.pdf_cache:
            return "", ""
        
        # Find the most recently updated PDF
        most_recent_pdf = None
        most_recent_timestamp = 0
        
        for filename, pdf_data in self.pdf_cache.items():
            timestamp = pdf_data.get('timestamp', 0)
            if timestamp > most_recent_timestamp:
                most_recent_timestamp = timestamp
                most_recent_pdf = filename
        
        if most_recent_pdf:
            pdf_data = self.pdf_cache[most_recent_pdf]
            full_content = pdf_data.get('full_text', '')
            return full_content, most_recent_pdf
        
        return "", ""

    def _get_specific_pdf_content(self, pdf_filename: str) -> str:
        """
        Get the full content of a specific PDF if it exists in cache
        """
        if pdf_filename in self.pdf_cache:
            return self.pdf_cache[pdf_filename].get('full_text', '')
        
        # Try to find partial matches
        for filename, pdf_data in self.pdf_cache.items():
            if pdf_filename.lower() in filename.lower():
                return pdf_data.get('full_text', '')
        
        return ""

#     def _handle_generic_question(self, query: str, format_style: str = "academic") -> str:
#         """
#         Handle generic questions by providing full PDF content to OpenAI
#         """
#         try:
#             # Get the most recent PDF content
#             full_content, pdf_filename = self._get_most_recent_pdf_content()
            
#             if not full_content:
#                 return self._generate_no_pdf_response(query)
            
#             # Truncate content if it's too long (to fit within token limits)
#             max_content_length = 12000  # Adjust based on your needs
#             if len(full_content) > max_content_length:
#                 truncated_content = full_content[:max_content_length]
#                 truncated_content += "\n\n[Note: Content has been truncated due to length limits]"
#             else:
#                 truncated_content = full_content
            
#             # Create comprehensive prompt for generic questions
#             if format_style == "academic":
#                 prompt = f"""
# You are an expert academic assistant. Based on the complete PDF document provided below, please provide a comprehensive and scholarly response to the following query:

# **Query:** {query}

# **PDF Document ({pdf_filename}):**
# {truncated_content}

# **Instructions:**
# 1. Provide a thorough and well-structured response
# 2. Use formal academic language
# 3. Include specific examples and details from the document
# 4. Organize your response with clear headings where appropriate
# 5. Cite relevant sections or page numbers when possible
# 6. Be comprehensive and detailed in your analysis
# 7. If the query asks for questions, provide well-formed, insightful questions
# 8. If the query asks for main topics, provide a detailed breakdown
# 9. If the query asks for summary, provide a comprehensive overview

# Please ensure your response is complete, accurate, and directly addresses the query using the full context of the PDF document.
# """
#             else:
#                 prompt = f"""
# Based on the complete PDF document provided below, please provide a comprehensive response to the following query:

# **Query:** {query}

# **PDF Document ({pdf_filename}):**
# {truncated_content}

# **Instructions:**
# 1. Provide a clear and detailed response
# 2. Use accessible language
# 3. Include specific examples from the document
# 4. Organize your response clearly
# 5. Be thorough and comprehensive
# 6. If the query asks for questions, provide well-formed questions
# 7. If the query asks for main topics, provide a detailed list
# 8. If the query asks for summary, provide a comprehensive overview

# Please ensure your response directly addresses the query using the full context of the PDF document.
# """
            
#             # Generate response using the generic LLM with higher token limit
#             response = generic_llm.predict(prompt)
            
#             # Add metadata about the source
#             formatted_response = f"""
# {response}

# ---
# **Source Information:**
# - PDF Document: {pdf_filename}
# - Analysis Type: Complete Document Analysis
# - Content Length: {len(full_content):,} characters
# - Processing Mode: Generic Question Handling
# """
            
#             return formatted_response
            
#         except Exception as e:
#             logging.error(f"Error handling generic question: {str(e)}")
#             return self._generate_error_response(query, str(e))
    
    def _handle_generic_question(self, query: str, format_style: str = "academic") -> str:
        try:
            full_content, pdf_filename = self._get_most_recent_pdf_content()
            if not full_content:
                return self._generate_no_pdf_response(query)

            max_content_length = 12000
            truncated_content = (
                full_content[:max_content_length] + "\n\n[Note: Truncated]" if len(full_content) > max_content_length else full_content
            )

            # Specialized Prompt for Question Generation
            if re.search(r'\bgenerate\b.*\bquestions?\b', query.lower()):
                prompt = f"""
    You are an academic exam expert. Your job is to create 15 unique, high-quality questions along with detailed answers based on the following PDF content.

    **Instructions:**
    - Cover multiple cognitive levels (definition, analysis, application).
    - Use at least 3 different formats: MCQ, short answer, descriptive.
    - Do not invent content not present in the text.
    - Format as:

    ### Question 1
    **Type**: [e.g., MCQ, Descriptive]  
    **Question**: ...  
    **Options** (if MCQ): A)... B)...  
    **Correct Answer**: ...  
    **Explanation**: ...

    **Query:** {query}
    **PDF Document ({pdf_filename}):**
    \"\"\"
    {truncated_content}
    \"\"\"
    """
            else:
                prompt = f"""
    You are an academic assistant. Answer the following query based solely on the provided PDF document.

    **Query:** {query}
    **PDF Document ({pdf_filename}):**
    \"\"\"
    {truncated_content}
    \"\"\"

    **Instructions:**
    - Be precise and well-structured.
    - Use formal academic language.
    - Cite the source context where appropriate.
    """

            # Use generic_llm
            response = generic_llm.predict(prompt)
            return f"{response}\n\n---\nSource: {pdf_filename} | Mode: GenericQuestionHandler"

        except Exception as e:
            logging.error(f"Error handling generic question: {str(e)}")
            return self._generate_error_response(query, str(e))

        
    def _build_question_generation_prompt(self, query: str, content: str, filename: str) -> str:
        return f"""
    You are an academic examination expert.

    Your task is to generate **at least 5 unique, exam-level questions** along with **detailed answers**, directly based on the content of the PDF provided below.

    Ensure the following:
    1. **Cover a range of cognitive levels**: factual recall, conceptual understanding, application, analysis.
    2. **Diversify formats**: include at least 1 multiple-choice question, 1 short-answer, and 1 descriptive question.
    3. **Use only the information from the PDF** — no external assumptions.
    4. **Present output in structured markdown format** as shown below.
    5. **Keep answers detailed but concise**, with references to sections or examples where relevant.

    ---

    **Query Instruction:** {query}

    **PDF Document ({filename}):**
    \"\"\"
    {content}
    \"\"\"

    ---

    **Output Format:**

    ### Question 1
    **Type**: Multiple Choice  
    **Question**:  
    **Options**:  
    - A) ...  
    - B) ...  
    - C) ...  
    - D) ...  
    **Correct Answer**:  
    **Explanation**:  

    ---

    ### Question 2  
    **Type**: Short Answer  
    **Question**:  
    **Answer**:  

    ---

    ### Question 3  
    **Type**: Descriptive  
    **Question**:  
    **Answer**:  

    ---

    Please generate five well-structured questions and their corresponding answers using only the provided document content.
    """

    def _build_standard_academic_prompt(self, query: str, content: str, filename: str) -> str:
        return f"""
    You are an expert academic assistant. Your goal is to analyze the full PDF document below and respond to the user's query in a **scholarly, well-organized** manner.

    **Query:** {query}

    **PDF Document ({filename}):**
    \"\"\"
    {content}
    \"\"\"

    **Instructions:**
    - Use academic tone and terminology.
    - Provide structured, coherent paragraphs with clear logic.
    - Cite specific parts of the document.
    - Avoid generic statements; ground everything in the text.

    Return your response in a formal markdown format.
    """


    def _generate_no_pdf_response(self, query: str) -> str:
        """Generate response when no PDF content is available"""
        return f"""
I'd be happy to help with your query: **{query}**

However, I don't currently have any PDF documents loaded in the system. To provide a comprehensive response, please:

1. **Upload a PDF document** using the `insert_into_index` method
2. **Ensure the PDF is properly processed** before asking questions
3. **Try your query again** once documents are available

If you have already uploaded documents, please check:
- The PDF processing completed successfully
- The document contains readable text content
- The system cache has the document information

Would you like me to help you with the document upload process?
"""

    def _generate_error_response(self, query: str, error_msg: str) -> str:
        """Generate response for errors during generic question handling"""
        return f"""
I apologize for encountering an issue while processing your query: **{query}**

**Error Details:** {error_msg}

**Possible Solutions:**
1. **Try rephrasing your question** in a different way
2. **Check if your PDF documents are properly loaded**
3. **Verify the document contains readable text content**
4. **Try a more specific question** if the document is very large

**Alternative Approaches:**
- Ask about specific topics within the document
- Request information about particular sections
- Break down complex queries into smaller parts

Would you like me to help you reformulate your question or check the system status?
"""

    async def insert_with_multiprocessing(self, texts: List[str], metadatas: List[dict], filename: str, 
                                        max_workers: int = None, batch_size: int = 50):
        """Ultra-fast document insertion with PDF caching and timestamp tracking"""
        if max_workers is None:
            max_workers = min(mp.cpu_count(), 6)
        
        try:
            start_time = time.time()
            current_timestamp = time.time()
            logging.info(f"Starting multiprocessing insertion for {len(texts)} chunks with {max_workers} workers")

            # Cache full PDF content for academic purposes with timestamp
            self.pdf_cache[filename] = {
                'full_text': ' '.join(texts),
                'chunks': texts,
                'metadata': metadatas,
                'timestamp': current_timestamp
            }
            
            # Update timestamp tracking
            self.pdf_timestamps[filename] = current_timestamp
            self.last_updated_pdf = filename
            
            logging.info(f"PDF {filename} cached successfully. Total cached PDFs: {len(self.pdf_cache)}")

            # Step 1: Generate embeddings in parallel batches
            embedding_start = time.time()
            vectors = await self._generate_embeddings_parallel(texts, max_workers, batch_size)
            embedding_time = time.time() - embedding_start
            logging.info(f"Embeddings generated in {embedding_time:.2f} seconds")

            # Step 2: Upload with enhanced metadata
            upload_start = time.time()
            await self._upload_vectors_parallel(texts, metadatas, vectors, filename, max_workers, batch_size)
            upload_time = time.time() - upload_start
            
            total_time = time.time() - start_time
            logging.info(f"Successfully indexed {filename} with {len(texts)} chunks in {total_time:.2f}s")
            logging.info(f"Performance breakdown - Embeddings: {embedding_time:.2f}s, Upload: {upload_time:.2f}s")

        except Exception as e:
            logging.error(f"Error in multiprocessing insertion: {str(e)}")
            raise

    async def _generate_embeddings_parallel(self, texts: List[str], max_workers: int, batch_size: int) -> List[List[float]]:
        """Generate embeddings using optimized parallel processing"""
        def process_embedding_batch(batch_texts):
            try:
                return self.embedding_model.embed_documents(batch_texts)
            except Exception as e:
                logging.error(f"Error in embedding batch: {str(e)}")
                return [[] for _ in batch_texts]

        text_batches = [texts[i:i + batch_size] for i in range(0, len(texts), batch_size)]
        
        loop = asyncio.get_event_loop()
        vectors = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            tasks = []
            for batch in text_batches:
                task = loop.run_in_executor(executor, process_embedding_batch, batch)
                tasks.append(task)
            
            batch_results = await asyncio.gather(*tasks)
            
            for batch_vectors in batch_results:
                vectors.extend(batch_vectors)
        
        return vectors

    async def _upload_vectors_parallel(self, texts: List[str], metadatas: List[dict], 
                                     vectors: List[List[float]], filename: str, 
                                     max_workers: int, batch_size: int):
        """Upload vectors with enhanced metadata for better search"""
        
        @retry(wait=wait_exponential(min=1, max=8), stop=stop_after_attempt(3))
        def upload_batch_with_retry(batch_points):
            try:
                self.qdrant_client.upsert(
                    collection_name=self.collection_name,
                    points=batch_points,
                    wait=False
                )
            except Exception as e:
                logging.error(f"Batch upload failed: {str(e)}")
                raise

        def create_upload_batch(batch_indices):
            batch_points = []
            for i in batch_indices:
                # Enhanced payload with comprehensive metadata
                payload = {
                    "page_content": texts[i],
                    "metadata": {
                        **metadatas[i],
                        "filename": filename,
                        "page_number": metadatas[i].get("page", 0),
                        "chunk_index": i,
                        "upload_timestamp": time.time(),
                        "content_length": len(texts[i]),
                        "chunk_type": self._classify_chunk_type(texts[i]),
                        "academic_relevance": self._calculate_academic_relevance(texts[i])
                    }
                }
                
                batch_points.append(
                    rest.PointStruct(
                        id=str(uuid.uuid4()),
                        vector=vectors[i],
                        payload=payload
                    )
                )
            
            upload_batch_with_retry(batch_points)
            return len(batch_points)

        indices = list(range(len(texts)))
        index_batches = [indices[i:i + batch_size] for i in range(0, len(indices), batch_size)]
        
        loop = asyncio.get_event_loop()
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            tasks = []
            for batch in index_batches:
                task = loop.run_in_executor(executor, create_upload_batch, batch)
                tasks.append(task)
            
            await asyncio.gather(*tasks)

    def _classify_chunk_type(self, text: str) -> str:
        """Classify chunk type for better academic processing"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['abstract', 'summary', 'conclusion']):
            return 'summary'
        elif any(word in text_lower for word in ['introduction', 'background', 'overview']):
            return 'introduction'
        elif any(word in text_lower for word in ['method', 'approach', 'technique', 'algorithm']):
            return 'methodology'
        elif any(word in text_lower for word in ['result', 'finding', 'analysis', 'data']):
            return 'results'
        elif any(word in text_lower for word in ['reference', 'citation', 'bibliography']):
            return 'references'
        else:
            return 'content'

    def _calculate_academic_relevance(self, text: str) -> float:
        """Calculate academic relevance score"""
        academic_keywords = [
            'research', 'study', 'analysis', 'method', 'result', 'conclusion',
            'hypothesis', 'theory', 'experiment', 'data', 'evidence', 'finding'
        ]
        
        text_lower = text.lower()
        score = sum(1 for keyword in academic_keywords if keyword in text_lower)
        return min(score / len(academic_keywords), 1.0)

    def insert_into_index(self, filepath: str, filename: str, batch_size: int = 100, max_workers: int = 4):
        """Enhanced document insertion with better async handling"""
        try:
            logging.info(f"Loading PDF: {filename}")
            loader = PDFMinerLoader(filepath)
            docs = loader.load()

            if not docs or not docs[0].page_content.strip():
                logging.warning(f"Empty document: {filename}")
                return

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,  # Increased for better context
                chunk_overlap=150,
                length_function=len,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            documents = text_splitter.split_documents(docs)

            if not documents:
                logging.warning(f"No valid chunks created from: {filename}")
                return

            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]

            # Better async handling
            try:
                loop = asyncio.get_running_loop()
                # Schedule as task if in async context
                asyncio.create_task(
                    self.insert_with_multiprocessing(texts, metadatas, filename, max_workers, batch_size)
                )
            except RuntimeError:
                # Create new loop if not in async context
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(
                        self.insert_with_multiprocessing(texts, metadatas, filename, max_workers, batch_size)
                    )
                finally:
                    loop.close()

        except Exception as e:
            logging.error(f"Error inserting document {filename}: {str(e)}")
            raise

    async def insert_into_index_async(self, filepath: str, filename: str, batch_size: int = 100, max_workers: int = 4):
        """Async version of insert_into_index"""
        try:
            logging.info(f"Loading PDF: {filename}")
            loader = PDFMinerLoader(filepath)
            docs = loader.load()

            if not docs or not docs[0].page_content.strip():
                logging.warning(f"Empty document: {filename}")
                return

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=150,
                length_function=len,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            documents = text_splitter.split_documents(docs)

            if not documents:
                logging.warning(f"No valid chunks created from: {filename}")
                return

            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]

            await self.insert_with_multiprocessing(texts, metadatas, filename, max_workers, batch_size)

        except Exception as e:
            logging.error(f"Error inserting document {filename}: {str(e)}")
            raise

    def insert_into_index_threaded(self, filepath: str, filename: str, batch_size: int = 100, max_workers: int = 4):
        """Thread-based solution for sync contexts"""
        try:
            logging.info(f"Loading PDF: {filename}")
            loader = PDFMinerLoader(filepath)
            docs = loader.load()

            if not docs or not docs[0].page_content.strip():
                logging.warning(f"Empty document: {filename}")
                return

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=150,
                length_function=len,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            documents = text_splitter.split_documents(docs)

            if not documents:
                logging.warning(f"No valid chunks created from: {filename}")
                return

            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]

            def run_async_in_thread():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    return loop.run_until_complete(
                        self.insert_with_multiprocessing(texts, metadatas, filename, max_workers, batch_size)
                    )
                finally:
                    loop.close()

            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_async_in_thread)
                future.result()

        except Exception as e:
            logging.error(f"Error inserting document {filename}: {str(e)}")
            raise

    def query_and_generate_response(self, query: str, top_k: int = 10, format_style: str = "academic") -> str:
        """
        Enhanced query method with generic question detection and handling
        """
        try:
            start_time = time.time()
            
            # Check if this is a generic question
            if self._is_generic_question(query):
                logging.info(f"Detected generic question: {query}")
                return self._handle_generic_question(query, format_style)
            
            # Step 1: Enhanced PDF context search with relevance scoring
            pdf_context, sources, search_metadata = self._get_enhanced_pdf_context(query, top_k)
            
            # Step 2: Determine if we should use direct OpenAI API with PDF
            use_direct_api = self._should_use_direct_pdf_api(query, sources)
            
            # Step 3: Generate response based on context availability
            if pdf_context and len(pdf_context.strip()) > 100:
                # PDF context found - create enhanced query with references
                enhanced_query = self._create_enhanced_query_with_references(query, pdf_context, sources)
                response = self._generate_structured_response(enhanced_query, pdf_context, format_style)
            else:
                # No strong PDF context - use comprehensive AI response
                response = self._generate_comprehensive_response(query, "", format_style)
            
            # Step 4: Format response according to specified style
            formatted_response = self._format_response_by_style(
                response, sources, search_metadata, format_style, time.time() - start_time
            )
            
            return formatted_response

        except Exception as e:
            logging.error(f"Error in query_and_generate_response: {str(e)}")
            return self._generate_error_fallback_response(query, str(e))

    def _get_enhanced_pdf_context(self, query: str, top_k: int) -> Tuple[str, List[Dict], Dict]:
        """Enhanced PDF context extraction with better relevance scoring"""
        try:
            query_vector = self.embedding_model.embed_query(query)
            search_results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=top_k,
                score_threshold=0.25,
                with_payload=True
            )

            pdf_context = ""
            sources = []
            search_metadata = {
                "total_results": len(search_results),
                "avg_score": 0,
                "best_score": 0,
                "document_types": set(),
                "academic_relevance": 0
            }
            
            if search_results:
                scores = [result.score for result in search_results]
                search_metadata["avg_score"] = sum(scores) / len(scores)
                search_metadata["best_score"] = max(scores)
                
                for i, result in enumerate(search_results):
                    payload = result.payload
                    metadata = payload.get("metadata", {})
                    content = payload.get("page_content", "").strip()
                    
                    if content:
                        # Enhanced context formatting with clear source attribution
                        pdf_context += f"\n--- SOURCE {i+1}: {metadata.get('filename', 'Unknown')} | Page {metadata.get('page_number', 'Unknown')} | Score: {result.score:.3f} ---\n"
                        pdf_context += content + "\n"
                        
                        search_metadata["document_types"].add(metadata.get("chunk_type", "content"))
                        search_metadata["academic_relevance"] += metadata.get("academic_relevance", 0)
                        
                        sources.append({
                            "filename": metadata.get('filename', 'Unknown'),
                            "page_number": metadata.get("page_number", "Unknown"),  # Fixed: comma instead of colon
                            "chunk_index": metadata.get('chunk_index', 0),
                            "score": result.score,
                            "content_preview": content[:100] + "..." if len(content) > 100 else content,
                            "chunk_type": metadata.get("chunk_type", "content"),
                            "academic_relevance": metadata.get("academic_relevance", 0)
                        })
                
                if sources:
                    search_metadata["academic_relevance"] /= len(sources)
                search_metadata["document_types"] = list(search_metadata["document_types"])
            
            return pdf_context, sources, search_metadata

        except Exception as e:
            logging.error(f"Error in enhanced PDF context search: {str(e)}")
            return "", [], {"error": str(e)}

    def _should_use_direct_pdf_api(self, query: str, sources: List[Dict]) -> bool:
        """Determine if we should use direct PDF API for better responses"""
        # Use direct API if we have good sources and complex query
        if len(sources) >= 3 and any(source["score"] > 0.7 for source in sources):
            return True
        
        # Check for complex analytical queries
        complex_patterns = [
            r'compare.*with', r'analyze.*relationship', r'what.*difference',
            r'how.*relate', r'connection.*between', r'impact.*of'
        ]
        
        query_lower = query.lower()
        return any(re.search(pattern, query_lower) for pattern in complex_patterns)

    def _create_enhanced_query_with_references(self, query: str, pdf_context: str, sources: List[Dict]) -> str:
        """Create enhanced query with source references"""
        source_summary = self._create_source_summary(sources)
        
        enhanced_query = f"""
            Original Query: {query}

            Context Information:
            {pdf_context}

            Source Summary:
            {source_summary}

            Please provide a comprehensive answer to the original query using the provided context. 
            Include specific references to the sources when relevant.
            """
        return enhanced_query

    def _create_source_summary(self, sources: List[Dict]) -> str:
        """Create a summary of sources for reference"""
        if not sources:
            return "No sources available"
        
        summary = f"Found {len(sources)} relevant sources:\n"
        for i, source in enumerate(sources, 1):
            summary += f"  {i}. {source['filename']} (Page {source['page_number']}) - Score: {source['score']:.3f}\n"
        
        return summary

    def _generate_structured_response(self, enhanced_query: str, pdf_context: str, format_style: str) -> str:
        """Generate structured response using appropriate LLM"""
        try:
            if format_style == "academic":
                llm = academic_llm
                system_prompt = """You are an expert academic researcher. Provide scholarly, well-referenced responses with proper citations and formal language."""
            elif format_style == "comprehensive":
                llm = comprehensive_llm
                system_prompt = """You are a comprehensive AI assistant. Provide detailed, thorough responses with clear structure and examples."""
            else:
                llm = formatting_llm
                system_prompt = """You are a professional AI assistant. Provide clear, well-formatted responses that are easy to understand."""
            
            full_prompt = f"{system_prompt}\n\n{enhanced_query}"
            response = llm.predict(full_prompt)
            
            return response
            
        except Exception as e:
            logging.error(f"Error generating structured response: {str(e)}")
            return self._generate_fallback_response(enhanced_query)

    def _generate_comprehensive_response(self, query: str, context: str, format_style: str) -> str:
        """Generate comprehensive response when no strong PDF context is available"""
        try:
            prompt = f"""
                    Query: {query}

                    Available Context: {context if context else "Limited context available"}

                    Please provide a comprehensive response to the query. If context is limited, 
                    explain what information would be helpful and suggest how to get better results.
                    """
            
            if format_style == "academic":
                if "generate" in query.lower() and "question" in query.lower():
                    prompt = self._build_question_generation_prompt(query, context, pdf_filename)
                else:
                    prompt = self._build_standard_academic_prompt(query, truncated_content, pdf_filename)

                response = academic_llm.predict(prompt)
            else:
                response = comprehensive_llm.predict(prompt)

            return response
            
        except Exception as e:
            logging.error(f"Error generating comprehensive response: {str(e)}")
            return f"I apologize, but I encountered an error while processing your query: {query}. Please try rephrasing your question or check if the PDF documents are properly loaded."

    def _format_response_by_style(self, response: str, sources: List[Dict], 
                                 search_metadata: Dict, format_style: str, 
                                 processing_time: float) -> str:
        """Format response according to specified style"""
        try:
            if format_style == "academic":
                formatted_response = self._format_academic_response(response, sources, search_metadata)
            elif format_style == "comprehensive":
                formatted_response = self._format_comprehensive_response(response, sources, search_metadata)
            else:
                formatted_response = self._format_standard_response(response, sources, search_metadata)
            
            # Add processing metadata
            formatted_response += f"\n\n---\n**Processing Information:**\n"
            formatted_response += f"- Processing Time: {processing_time:.2f} seconds\n"
            formatted_response += f"- Sources Found: {search_metadata.get('total_results', 0)}\n"
            formatted_response += f"- Average Relevance Score: {search_metadata.get('avg_score', 0):.3f}\n"
            formatted_response += f"- Best Match Score: {search_metadata.get('best_score', 0):.3f}\n"
            
            return formatted_response
            
        except Exception as e:
            logging.error(f"Error formatting response: {str(e)}")
            return response  # Return unformatted response if formatting fails

    def _format_academic_response(self, response: str, sources: List[Dict], search_metadata: Dict) -> str:
        """Format response in academic style"""
        formatted_response = f"## Academic Analysis\n\n{response}\n\n"
        
        if sources:
            formatted_response += "## Sources and References\n\n"
            for i, source in enumerate(sources, 1):
                formatted_response += f"**[{i}]** {source['filename']} - Page {source['page_number']} "
                formatted_response += f"(Relevance: {source['score']:.3f}, Type: {source['chunk_type']})\n"
                formatted_response += f"   *Preview:* {source['content_preview']}\n\n"
        
        return formatted_response

    def _format_comprehensive_response(self, response: str, sources: List[Dict], search_metadata: Dict) -> str:
        """Format response in comprehensive style"""
        formatted_response = f"# Comprehensive Response\n\n{response}\n\n"
        
        if sources:
            formatted_response += "## Detailed Source Information\n\n"
            for i, source in enumerate(sources, 1):
                formatted_response += f"### Source {i}: {source['filename']}\n"
                formatted_response += f"- **Page:** {source['page_number']}\n"
                formatted_response += f"- **Relevance Score:** {source['score']:.3f}\n"
                formatted_response += f"- **Content Type:** {source['chunk_type']}\n"
                formatted_response += f"- **Academic Relevance:** {source['academic_relevance']:.3f}\n"
                formatted_response += f"- **Preview:** {source['content_preview']}\n\n"
        
        return formatted_response

    def _format_standard_response(self, response: str, sources: List[Dict], search_metadata: Dict) -> str:
        """Format response in standard style"""
        formatted_response = f"{response}\n\n"
        
        if sources:
            formatted_response += "**Sources:**\n"
            for i, source in enumerate(sources, 1):
                formatted_response += f"{i}. {source['filename']} (Page {source['page_number']}) - Score: {source['score']:.3f}\n"
        
        return formatted_response

    def _generate_fallback_response(self, query: str) -> str:
        """Generate fallback response when other methods fail"""
        return f"""
I apologize, but I encountered an issue while processing your query: "{query}"

This might be due to:
1. **PDF Processing Issues**: The document might not be properly loaded or processed
2. **Complex Query**: Your question might require a different approach
3. **System Resources**: Temporary processing limitations

**Suggestions:**
- Try rephrasing your question with more specific terms
- Check if the PDF document is properly uploaded and indexed
- Break down complex questions into smaller, more focused queries
- Ensure the document contains readable text content

Would you like me to help you reformulate your question or check the system status?
"""

    def _generate_error_fallback_response(self, query: str, error: str) -> str:
        """Generate error fallback response"""
        return f"""
**Error Processing Query:** {query}

**Technical Details:** {error}

**Recommended Actions:**
1. **Check PDF Status**: Ensure your documents are properly loaded
2. **Simplify Query**: Try asking a more straightforward question
3. **Verify System**: Check if the Qdrant database is accessible
4. **Retry**: Sometimes temporary issues resolve themselves

**Alternative Approaches:**
- Ask about specific topics rather than general summaries
- Request information from particular sections of the document
- Use keywords that might appear in the document

If the problem persists, please check the system logs for more detailed error information.
"""

    def get_collection_info(self) -> Dict:
        """Get information about the current collection"""
        try:
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            
            # Get sample points for analysis
            sample_points = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                limit=10,
                with_payload=True
            )
            
            info = {
                "collection_name": self.collection_name,
                "total_vectors": collection_info.vectors_count,
                "indexed_vectors": collection_info.indexed_vectors_count,
                "vector_size": collection_info.config.params.vectors.size,
                "distance_metric": collection_info.config.params.vectors.distance.name,
                "cached_pdfs": len(self.pdf_cache),
                "pdf_filenames": list(self.pdf_cache.keys()),
                "last_updated_pdf": self.last_updated_pdf,
                "sample_points": len(sample_points[0]) if sample_points else 0
            }
            
            return info
            
        except Exception as e:
            logging.error(f"Error getting collection info: {str(e)}")
            return {"error": str(e)}

    def delete_collection(self):
        """Delete the current collection"""
        try:
            self.qdrant_client.delete_collection(self.collection_name)
            self.pdf_cache.clear()
            self.pdf_timestamps.clear()
            self.last_updated_pdf = None
            logging.info(f"Collection {self.collection_name} deleted successfully")
            return True
        except Exception as e:
            logging.error(f"Error deleting collection: {str(e)}")
            return False

    def list_cached_pdfs(self) -> Dict:
        """List all cached PDFs with their metadata"""
        try:
            pdf_info = {}
            for filename, data in self.pdf_cache.items():
                pdf_info[filename] = {
                    "timestamp": data.get("timestamp", 0),
                    "chunks_count": len(data.get("chunks", [])),
                    "total_characters": len(data.get("full_text", "")),
                    "last_updated": time.ctime(data.get("timestamp", 0))
                }
            
            return {
                "total_cached_pdfs": len(self.pdf_cache),
                "most_recent_pdf": self.last_updated_pdf,
                "pdf_details": pdf_info
            }
            
        except Exception as e:
            logging.error(f"Error listing cached PDFs: {str(e)}")
            return {"error": str(e)}

    def clear_pdf_cache(self):
        """Clear the PDF cache"""
        try:
            self.pdf_cache.clear()
            self.pdf_timestamps.clear()
            self.last_updated_pdf = None
            logging.info("PDF cache cleared successfully")
            return True
        except Exception as e:
            logging.error(f"Error clearing PDF cache: {str(e)}")
            return False


# Initialize the QdrantIndex
qdrant_index = QdrantIndex(
    qdrant_host=qdrant_host,
    qdrant_api_key=qdrant_api_key,
    prefer_grpc=prefer_grpc
)

# Main functions for external use
def insert_pdf(filepath: str, filename: str, batch_size: int = 100, max_workers: int = 4):
    """Insert a PDF document into the index"""
    try:
        qdrant_index.insert_into_index_threaded(filepath, filename, batch_size, max_workers)
        logging.info(f"Successfully inserted PDF: {filename}")
        return True
    except Exception as e:
        logging.error(f"Failed to insert PDF {filename}: {str(e)}")
        return False

async def insert_pdf_async(filepath: str, filename: str, batch_size: int = 100, max_workers: int = 4):
    """Async version of PDF insertion"""
    try:
        await qdrant_index.insert_into_index_async(filepath, filename, batch_size, max_workers)
        logging.info(f"Successfully inserted PDF: {filename}")
        return True
    except Exception as e:
        logging.error(f"Failed to insert PDF {filename}: {str(e)}")
        return False

def query_pdf(query: str, top_k: int = 10, format_style: str = "academic") -> str:
    """Query the PDF index and get a formatted response"""
    try:
        return qdrant_index.query_and_generate_response(query, top_k, format_style)
    except Exception as e:
        logging.error(f"Error querying PDF: {str(e)}")
        return f"Error processing query: {str(e)}"

def get_system_info() -> Dict:
    """Get system information"""
    return qdrant_index.get_collection_info()

def list_pdfs() -> Dict:
    """List all cached PDFs"""
    return qdrant_index.list_cached_pdfs()

def clear_cache():
    """Clear the PDF cache"""
    return qdrant_index.clear_pdf_cache()

def delete_index():
    """Delete the entire index"""
    return qdrant_index.delete_collection()

# Example usage
if __name__ == "__main__":
    # Example of how to use the system
    print("PDF Query System initialized")
    print("Available functions:")
    print("- insert_pdf(filepath, filename)")
    print("- query_pdf(query, top_k, format_style)")
    print("- get_system_info()")
    print("- list_pdfs()")
    print("- clear_cache()")
    print("- delete_index()")
    
    # Example usage:
    # insert_pdf("/path/to/document.pdf", "document.pdf")
    # response = query_pdf("What are the main findings?", top_k=5, format_style="academic")
    # print(response)