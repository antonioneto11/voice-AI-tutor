# RAG

## Retrieval-augmented generation
RAG combines retrieval and generation. The system first fetches relevant context, then the model uses that context to answer the question. This improves grounding and makes the system less dependent on the base model memory alone.

## Common failure modes
RAG can fail when retrieval misses the right document, returns noisy context, ranks weak sections too high, or when the model overstates what the documents support.

## Interview framing
A simple way to explain RAG in an interview is: retrieve first, answer second, and measure whether the retrieved evidence actually improves correctness and trust.
