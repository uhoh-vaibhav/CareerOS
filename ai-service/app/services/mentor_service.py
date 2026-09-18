import hashlib
import logging
import re
from fastapi import HTTPException
from app.adapters.llm.factory import get_llm_provider
from app.adapters.vector.factory import get_vector_store
from app.prompts.mentor_prompt import SYSTEM_PROMPT
from app.schemas.mentor import MentorMessageRequest, MentorMessageResponse

logger = logging.getLogger(__name__)


async def handle_mentor_message(payload: MentorMessageRequest) -> MentorMessageResponse:
    vector_store = get_vector_store()
    llm = get_llm_provider()
    # ChromaDB only allows [a-zA-Z0-9._-] in collection names, 3-63 chars
    safe_id = re.sub(r"[^a-zA-Z0-9._-]", "_", payload.profile_id)[:50]
    collection = f"cm_{safe_id}"

    # Step: retrieve top-k similar vectors from Career Memory
    retrieved = await vector_store.query(collection, payload.message, top_k=5)
    context_texts = [item["text"] for item in retrieved]

    # Step: assemble structured career context from CareerOS modules
    context_sections = []

    if payload.career_context:
        ctx = payload.career_context
        career_details = []
        if ctx.get("targetRole"):
            career_details.append(f"Target Role: {ctx['targetRole']}")
        if ctx.get("detectedSkills"):
            skills = ctx['detectedSkills']
            if isinstance(skills, list) and skills:
                career_details.append(f"Skills Detected in Resume: {', '.join(skills)}")
        if ctx.get("missingSkills"):
            missing = ctx['missingSkills']
            if isinstance(missing, list) and missing:
                career_details.append(f"Current Missing Skills to Learn: {', '.join(missing)}")
        if ctx.get("readinessScore") is not None:
            career_details.append(f"Current Career Readiness Score: {ctx['readinessScore']}%")
        if ctx.get("roadmap"):
            rm = ctx['roadmap']
            career_details.append(f"Roadmap Overall Progress: {rm.get('progressPct', 0)}%")
            if rm.get("currentMilestone"):
                cm = rm['currentMilestone']
                career_details.append(f"Active Next Learning Milestone: {cm.get('milestone')} (Phase: {cm.get('phase')}) - {cm.get('description', '')}")
        if ctx.get("latestInterview"):
            iv = ctx['latestInterview']
            career_details.append(f"Latest Mock Interview: Score {iv.get('score', 0)}/100 for {iv.get('role', 'Target Role')}")
        if ctx.get("portfolio"):
            pf = ctx['portfolio']
            career_details.append(f"GitHub Portfolio Analysis: Score {pf.get('score', 0)}/100 (Username: {pf.get('githubUsername')})")

        if career_details:
            context_sections.append("CURRENT STUDENT CAREER STATE & ACADEMIC PROGRESS:\n" + "\n".join(f"- {d}" for d in career_details))

    if context_texts:
        context_sections.append("RECALLED PRIOR CONVERSATION HISTORY:\n" + "\n".join(f"- {c}" for c in context_texts))

    context_block = "\n\n".join(context_sections) or "(No prior history or profile data recorded yet)"
    prompt = (
        f"{context_block}\n\n"
        f"Student's Message: {payload.message}"
    )

    # Step: call LLM
    try:
        reply = await llm.generate(prompt, system=SYSTEM_PROMPT)
    except Exception as e:
        logger.error(f"Mentor LLM generation failed: {e}")
        raise HTTPException(status_code=502, detail="The AI Mentor is temporarily unavailable.")

    # Step: summarize this exchange and write back to Career Memory
    summary = f"Q: {payload.message}\nA: {reply}"
    msg_hash = hashlib.sha256(payload.message.encode()).hexdigest()[:16]
    try:
        await vector_store.upsert(
            collection,
            id=f"{safe_id}_{msg_hash}",
            text=summary,
            metadata={"profile_id": payload.profile_id},
        )
    except Exception as e:
        logger.warning(f"Could not persist mentor memory to ChromaDB: {e}")

    return MentorMessageResponse(reply=reply, retrieved_context=context_texts)
