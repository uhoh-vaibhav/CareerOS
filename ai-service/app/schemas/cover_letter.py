from pydantic import BaseModel

class CoverLetterGenerateRequest(BaseModel):
    job_description: str
    student_context: str

class CoverLetterGenerateResponse(BaseModel):
    cover_letter: str
