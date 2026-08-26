from app.adapters.llm.factory import get_llm_provider
from app.adapters.vector.factory import get_vector_store
from app.schemas.dto import MentorMessageRequest, MentorMessageResponse

MENTOR_SYSTEM_PROMPT = (
    "You are CareerOS's AI Career Mentor. Use the retrieved context about "
    "this student's history to personalize your guidance. Be encouraging "
    "and specific."
)


async def handle_mentor_message(payload: MentorMessageRequest) -> MentorMessageResponse:
    vector_store = get_vector_store()
    llm = get_llm_provider()
    collection = f"career_memory:{payload.profile_id}"

    # Step: retrieve top-k similar vectors from Career Memory
    retrieved = await vector_store.query(collection, payload.message, top_k=5)
    context_texts = [item["text"] for item in retrieved]

    # Step: assemble prompt (query + retrieved context + system instructions)
    context_block = "\n".join(f"- {c}" for c in context_texts) or "(no prior context yet)"
    prompt = (
        f"Prior context for this student:\n{context_block}\n\n"
        f"Student's new message: {payload.message}"
    )

    # Step: call LLM
    reply = await llm.generate(prompt, system=MENTOR_SYSTEM_PROMPT)

    # Step: summarize this exchange and write back to Career Memory
    summary = f"Q: {payload.message}\nA: {reply}"
    await vector_store.upsert(
        collection,
        id=f"{payload.profile_id}:{hash(payload.message)}",
        text=summary,
        metadata={"profile_id": payload.profile_id},
    )

    return MentorMessageResponse(reply=reply, retrieved_context=context_texts)
