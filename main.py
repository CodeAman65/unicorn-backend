

import os
import warnings
import json
import warnings
warnings.filterwarnings("ignore", category=UserWarning)
# from google import genai as genai_client
from groq import Groq
from crewai import Agent, Task, Crew, Process, LLM
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
from dotenv import load_dotenv
load_dotenv()

# ==========================================
# 1. FASTAPI & STRUCTURAL SETUP
# ==========================================
app = FastAPI(title="AI Resume Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_api_key = "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"    # Naya Groq key yahan
os.environ["GROQ_API_KEY"] = groq_api_key

groq_llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=groq_api_key
)
# Groq client — interview + edit ke liye
groq_client = Groq(api_key=groq_api_key)

# ==========================================
# 2. REQUEST MODEL  (frontend se aata hai)
# ==========================================
class ResumeRequest(BaseModel):
    profile: str
    jd: str


# ==========================================
# 3. PYDANTIC OUTPUT SCHEMA
#    Frontend ke saare fields cover hain +
#    projects / education / ats_score naye add kiye
# ==========================================
class ExperienceItem(BaseModel):
    role: str = Field(..., description="Role Title @ Company Name")
    duration: str = Field(..., description="Start Date – End Date or duration e.g. '6 Months'")
    points: List[str] = Field(
        ...,
        description=(
            "3-5 ATS-optimized bullet points. "
            "Each must: (1) start with a strong action verb like Architected/Engineered/Spearheaded/Diagnosed, "
            "(2) name the exact tech used, "
            "(3) end with a quantified result (%, ms, users, scale) wherever possible. "
            "Zero filler phrases like 'passionate' or 'team player'."
        )
    )

class ProjectItem(BaseModel):
    name: str = Field(..., description="Project name with tech stack e.g. 'E-Commerce Backend (Node.js, MySQL, Express.js)'")
    points: List[str] = Field(
        ...,
        description=(
            "3-5 bullets covering: architectural decisions made, specific technical challenges solved, "
            "security/performance implementations, and measurable outcomes. "
            "Each bullet starts with an action verb."
        )
    )

class EducationItem(BaseModel):
    degree: str = Field(..., description="Degree and major e.g. 'B.Tech in Computer Science'")
    institution: str = Field(..., description="University or college name")
    year: str = Field(..., description="Graduation year or 'Expected YYYY'")

class ResumeSchema(BaseModel):
    name: str = Field(..., description="Candidate's full name")
    contact: str = Field(
        ...,
        description="Single formatted string: Phone • Email • LinkedIn URL"
    )
    summary: str = Field(
        ...,
        description=(
            "Exactly 2-3 sentences. Must: mirror the JD's exact terminology, "
            "name the candidate's top 2-3 technical strengths, "
            "state the role they are targeting. No generic phrases."
        )
    )
    experience: List[ExperienceItem] = Field(
        ...,
        description="All work experiences with JD-tailored, high-impact bullets"
    )
    projects: List[ProjectItem] = Field(
        ...,
        description="2-3 most relevant personal/academic projects with deep technical detail"
    )
    skills: List[str] = Field(
        ...,
        description=(
            "Skills grouped by category as formatted strings. "
            "Example: 'Languages: JavaScript, SQL' | 'Backend: Node.js, Express.js, REST APIs' | "
            "'Frontend: React, Tailwind CSS' | 'Databases: MySQL, MongoDB' | 'Tools: Git, Postman, Docker'"
        )
    )
    education: List[EducationItem] = Field(
        ...,
        description="Educational qualifications"
    )
    ats_score: str = Field(
        ...,
        description=(
            "Format: '88% — <one sentence reason why this score>'. "
            "Be honest. Score based on keyword match with JD, quantified achievements, "
            "and action verb strength."
        )
    )


# ==========================================
# 4. CREWAI MULTI-AGENT PIPELINE
# ==========================================
def generate_professional_resume(user_input: str, job_description: str):

    # --- AGENT 1: Data Extractor ---
    data_extractor = Agent(
        role='Career Data Architect',
        goal=(
            'Extract and structure EVERY meaningful detail from the raw user input. '
            'Miss nothing — skills, projects, tech stack, metrics, dates, education, tools used.'
        ),
        backstory=(
            "You are an expert career consultant who turns messy, informal candidate notes into "
            "clean structured data. You find hidden achievements and implied metrics even when "
            "the user hasn't explicitly stated them. You never discard any detail."
        ),
        verbose=True,
        allow_delegation=False,
        llm=groq_llm
    )

    # --- AGENT 2: Resume Writer ---
    resume_writer = Agent(
        role='Elite Executive Resume Writer',
        goal=(
            'Write a world-class resume tailored precisely to the Job Description. '
            'Every bullet starts with a powerful action verb and ends with a measurable result. '
            'Mirror the JD language naturally. Zero filler. Show ownership and technical depth.'
        ),
        backstory=(
            "Former FAANG senior recruiter with 10+ years experience. You know hiring managers "
            "scan resumes in 6 seconds. You write bullets that demonstrate architectural decisions, "
            "ownership, and business impact — never just task descriptions. "
            "You turn 'built a login page' into 'Engineered JWT-based auth system reducing "
            "unauthorized access attempts by 95% across 3 microservices'."
        ),
        verbose=True,
        allow_delegation=False,
        llm=groq_llm
    )

    # --- AGENT 3: ATS Reviewer ---
    ats_reviewer = Agent(
        role='ATS Optimization Specialist',
        goal=(
            'Audit the resume draft against the JD. Ensure 85%+ keyword match. '
            'Remove all filler. Verify action verb strength. '
            'Output ONLY the final data matching the ResumeSchema JSON structure exactly.'
        ),
        backstory=(
            "You have reverse-engineered every major ATS system. You know which keywords get "
            "a resume filtered out and which get it ranked top 10%. You embed keywords naturally "
            "inside bullets — never as a keyword dump. You are ruthless about removing generic "
            "phrases and ensuring every word earns its place on the page."
        ),
        verbose=True,
        allow_delegation=False,
        llm=groq_llm
    )

    # --- TASK 1 ---
    extract_task = Task(
        description=(
            f"Analyze this raw candidate profile:\n\n{user_input}\n\n"
            "Extract ALL of the following in a clean structured format:\n"
            "- Full name and complete contact details\n"
            "- Every technical skill (group by: Languages, Frontend, Backend, Databases, Tools)\n"
            "- All work experiences: company, role, dates, every bullet/achievement mentioned\n"
            "- All projects: name, tech stack, what was built, any metrics mentioned\n"
            "- Education: degree, institution, year\n"
            "- Any implied scale or metrics (e.g. 'built for our company' → note company size if given)\n"
            "Output a thorough structured summary. Miss nothing."
        ),
        expected_output="A complete structured summary of the candidate's background with all details preserved.",
        agent=data_extractor
    )

    # --- TASK 2 ---
    write_task = Task(
        description=(
            f"Using the extracted candidate data, write a complete resume tailored for this JD:\n\n"
            f"{job_description}\n\n"
            "Strict rules:\n"
            "1. EVERY bullet starts with a strong action verb (Architected, Engineered, Spearheaded, "
            "Optimized, Diagnosed, Implemented, Designed, Reduced, Increased)\n"
            "2. EVERY bullet names the exact technology used\n"
            "3. At least 60% of bullets must have a quantified result (%, time, users, scale, requests/sec)\n"
            "4. Summary must be 2-3 sentences using the JD's exact language\n"
            "5. Projects must highlight DECISIONS made, not just what was built\n"
            "6. Skills must be grouped by category\n"
            "7. Banned phrases: passionate, hardworking, team player, detail-oriented, "
            "motivated, eager, responsible for, assisted with, helped with\n"
            "8. Write all sections: name, contact, summary, experience, projects, skills, education"
        ),
        expected_output="A complete high-impact resume draft covering all sections with JD-tailored content.",
        agent=resume_writer
    )

    # --- TASK 3 ---
    review_task = Task(
        description=(
            "Final audit of the resume draft against the JD:\n"
            "1. Check every bullet — if no quantified result exists, add a realistic, specific one\n"
            "2. Ensure every critical JD keyword appears naturally in the text at least once\n"
            "3. Remove any remaining filler or banned phrases\n"
            "4. Verify action verbs are strong and varied (no repeating the same verb)\n"
            "5. Confirm skills are grouped by category\n"
            "6. Calculate an honest ATS score with one-sentence justification\n"
            "7. Output ONLY the final data in the exact ResumeSchema JSON structure — no extra text, "
            "no markdown fences, no preamble"
        ),
        expected_output="Final polished resume data perfectly matching the ResumeSchema JSON structure.",
        agent=ats_reviewer,
        output_json=ResumeSchema
    )

    # --- CREW ---
    resume_crew = Crew(
        agents=[data_extractor, resume_writer, ats_reviewer],
        tasks=[extract_task, write_task, review_task],
        process=Process.sequential
    )

    crew_output = resume_crew.kickoff()
    return crew_output.json_dict


# ==========================================
# 5. FASTAPI ENDPOINT  (same URL as before — frontend connection intact)
# ==========================================
@app.get("/")
async def root():
    return {"status": "healthy", "message": "AI Resume Builder Backend is running!"}

@app.post("/api/generate-resume")
async def build_resume_endpoint(data: ResumeRequest):
    if not data.profile or not data.jd:
        raise HTTPException(
            status_code=400,
            detail="Profile aur JD dono fill karna zaroori hai!"
        )

    try:
        resume_data = generate_professional_resume(data.profile, data.jd)
        return resume_data

    except Exception as e:
        print(f"Server Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI generation pipeline failed: {str(e)}"
        )
# ==========================================
# 6. TARGET 3: EDIT RESUME ENDPOINT (Naya Add Karo)
# ==========================================

# 1. Edit request ke liye validation schema
class EditResumeRequest(BaseModel):
    currentResume: ResumeSchema  # Tumhara purana schema yahan use kar rhe hain taaki data safe rahe
    instruction: str

@app.post("/api/edit-resume")
async def edit_resume_endpoint(data: EditResumeRequest):
    if not data.instruction:
        raise HTTPException(
            status_code=400, 
            detail="Bhai, kuch instruction toh likho ki kya edit karna hai!"
        )

    try:
        # Gemini ko instruction dene ke liye prompt taiyar karo
        system_instruction = (
            "You are an expert resume editor. You will receive a candidate's current resume in structured JSON format "
            "along with a specific user instruction detailing changes, rewrites, or additions to make. "
            "Your job is to apply those edits meticulously across the relevant fields (summary, experience, skills, etc.) "
            "while maintaining the strict ATS-optimized high-impact style (action verbs, quantified metrics if applicable). "
            "\n\nCRITICAL: You must return ONLY the updated JSON structure that perfectly maps to the original input schema. "
            "Do not include any chat formatting, markdown blocks (like ```json), introduction, or conversational filler."
        )

        # JSON data aur instruction ko string mein bundle karo
        import json
        user_content = (
            f"Current Resume Data (JSON):\n{json.dumps(data.currentResume.model_dump())}\n\n"
            f"User Edit Instruction: {data.instruction}"
        )

        groq_messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            max_tokens=4000,
            # temperature=0.3
            response_format={"type": "json_object"}
        )

        cleaned_response = response.choices[0].message.content.strip()
        
        # Agar Gemini markdown backticks ```json lagaye toh use safely remove karo
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response.strip("```").strip("json").strip()

        # Modified text ko dictionary mein convert karke frontend ko return karo
        updated_resume_dict = json.loads(cleaned_response)
        return updated_resume_dict

    except json.JSONDecodeError as je:
        print(f"JSON Decode Error: {str(je)} | Raw response was: {cleaned_response}")
        raise HTTPException(
            status_code=500, 
            detail="AI ne invalid JSON bana diya, please instruction thoda clear likh kar firse try karein."
        )
    except Exception as e:
        print(f"Edit Server Error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Resume edit pipeline failed: {str(e)}"
        )
    
# ==========================================
# INTERVIEW ENDPOINT
# ==========================================
class Message(BaseModel):
    role: str   # "user" ya "assistant"
    content: str

class InterviewRequest(BaseModel):
    resume_data: dict        # Generated resume JSON
    job_role: str            # Job role — auto ya manual
    conversation: list[Message]  # Poori chat history

@app.post("/api/interview")
async def interview_endpoint(data: InterviewRequest):
    if not data.job_role:
        raise HTTPException(status_code=400, detail="Job role required!")

    try:
        # Resume context banao
        resume_context = ""
        if data.resume_data:
            resume_context = f"""
Candidate Resume:
- Name: {data.resume_data.get('name', 'Candidate')}
- Summary: {data.resume_data.get('summary', '')}
- Skills: {', '.join(data.resume_data.get('skills', []))}
- Experience: {str(data.resume_data.get('experience', []))}
- Projects: {str(data.resume_data.get('projects', []))}
"""

        # System prompt — interviewer personality
        system_prompt = f"""You are an expert technical interviewer conducting a mock interview for the role of: {data.job_role}.

{resume_context}

Your rules:
1. Ask ONE question at a time — never multiple questions together
2. Follow the STAR method (Situation, Task, Action, Result) for behavioral questions
3. Ask intelligent follow-up questions based on the candidate's PREVIOUS answer
4. Mix technical questions with behavioral ones naturally
5. If the answer is vague, probe deeper — "Can you elaborate on that?" or "What was the specific outcome?"
6. After every 4-5 questions, give brief encouraging feedback
7. Start the interview with a warm welcome and first question
8. Keep responses concise — you are an interviewer, not a teacher
9. Use the candidate's resume details to ask specific questions about their projects and experience
10. Never break character — always stay as the interviewer

Interview style: Professional but conversational. Make the candidate feel comfortable."""

        groq_messages = [{"role": "system", "content": system_prompt}]

        for msg in data.conversation:
            groq_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            max_tokens=1000,
            temperature=0.7,
        )
        return {"reply": response.choices[0].message.content}

    except Exception as e:
        print(f"Interview Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Interview agent failed: {str(e)}")
    
# ==========================================
# COMPANY PREP PACK ENDPOINT
# ==========================================
class PrepPackRequest(BaseModel):
    job_role: str
    company: str
    resume_data: dict = {}

@app.post("/api/prep-pack")
async def prep_pack_endpoint(data: PrepPackRequest):
    if not data.company or not data.job_role:
        raise HTTPException(status_code=400, detail="Company aur job role dono required hain!")

    try:
        # Resume context
        resume_context = ""
        if data.resume_data:
            resume_context = f"""
Candidate Background:
- Skills: {', '.join(data.resume_data.get('skills', []))}
- Experience: {str(data.resume_data.get('experience', []))}
- Projects: {str(data.resume_data.get('projects', []))}
"""

        system_prompt = """You are a world-class career coach and technical interview expert with deep knowledge of how top tech companies hire. You have insider knowledge of company cultures, interview formats, and hiring patterns.

You create extremely detailed, actionable company-specific interview prep packs that feel like they were written by someone who has been through hundreds of interviews at that specific company.

CRITICAL: Always respond in valid JSON format only. No markdown, no extra text."""

        user_prompt = f"""Create a comprehensive interview prep pack for:
Company: {data.company}
Role: {data.job_role}
{resume_context}

Return EXACTLY this JSON structure:
{{
  "company": "{data.company}",
  "role": "{data.job_role}",
  "culture": {{
    "summary": "2-3 sentence company culture summary",
    "values": ["value1", "value2", "value3", "value4"],
    "work_style": "Description of work environment and style"
  }},
  "interview_process": {{
    "rounds": [
      {{"round": "Round name", "description": "What happens in this round", "duration": "Duration"}}
    ],
    "total_rounds": "Number like 4-5 rounds",
    "timeline": "Typical timeline like 2-3 weeks"
  }},
  "technical_questions": [
    {{"question": "Question text", "category": "DSA/System Design/Frontend/Backend etc", "difficulty": "Easy/Medium/Hard", "tip": "How to approach this"}}
  ],
  "behavioral_questions": [
    {{"question": "Question text", "framework": "STAR", "focus_area": "Leadership/Ownership/etc"}}
  ],
  "company_specific_tips": [
    "Specific actionable tip 1",
    "Specific actionable tip 2",
    "Specific actionable tip 3",
    "Specific actionable tip 4",
    "Specific actionable tip 5"
  ],
  "key_technologies": ["tech1", "tech2", "tech3", "tech4", "tech5"],
  "red_flags_to_avoid": ["mistake1", "mistake2", "mistake3"],
  "preparation_timeline": {{
    "week1": "What to focus on week 1",
    "week2": "What to focus on week 2",
    "week3": "What to focus on week 3"
  }}
}}

Make it extremely specific to {data.company}. Include real interview patterns, actual question types they ask, and insider tips. Make technical_questions have 5 questions and behavioral_questions have 4 questions."""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=3000,
            temperature=0.7,
        )

        raw = response.choices[0].message.content.strip()

        # Clean markdown if any
        if raw.startswith("```"):
            raw = raw.strip("`").strip()
            if raw.startswith("json"):
                raw = raw[4:].strip()

        import json
        prep_data = json.loads(raw)
        return prep_data

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI ne invalid JSON diya, retry karo.")
    except Exception as e:
        print(f"Prep Pack Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prep pack generation failed: {str(e)}")
    
# ==========================================
# STAR SCORER ENDPOINT
# ==========================================
class ScoreRequest(BaseModel):
    question: str      # AI ne kya puchha tha
    answer: str        # User ne kya jawab diya
    job_role: str      # Kis role ke liye interview

@app.post("/api/score-answer")
async def score_answer_endpoint(data: ScoreRequest):
    if not data.answer or not data.question:
        raise HTTPException(status_code=400, detail="Question aur answer dono chahiye!")

    try:
        system_instruction = """You are an expert interview coach who scores answers using the STAR framework.

STAR Framework:
- Situation (0-25): Did they clearly describe the context/background?
- Task (0-25): Did they explain their specific responsibility?
- Action (0-25): Did they describe concrete steps they took?
- Result (0-25): Did they quantify the outcome?

You must respond in this EXACT JSON format (no markdown, no extra text):
{
  "total_score": 78,
  "breakdown": {
    "situation": {"score": 20, "max": 25, "feedback": "Good context but missing timeline"},
    "task": {"score": 18, "max": 25, "feedback": "Role was clear"},
    "action": {"score": 25, "max": 25, "feedback": "Excellent — specific steps mentioned"},
    "result": {"score": 15, "max": 25, "feedback": "Result mentioned but not quantified"}
  },
  "weak_areas": ["Add specific numbers to your result", "Mention the timeline"],
  "ideal_answer": "A complete rewritten version of their answer following perfect STAR format",
  "verdict": "Good" 
}

verdict must be one of: "Excellent" (85-100), "Good" (65-84), "Average" (45-64), "Needs Work" (0-44)"""

        user_content = f"""Job Role: {data.job_role}

Interview Question: {data.question}

Candidate's Answer: {data.answer}

Score this answer on STAR framework and provide detailed feedback."""

        groq_messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            max_tokens=1500,
            temperature=0.3
        )

        raw = response.choices[0].message.content.strip()

        # Clean markdown agar ho
        if raw.startswith("```"):
            raw = raw.strip("```").strip("json").strip()

        score_data = json.loads(raw)
        return score_data

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Scoring failed — invalid JSON from AI")
    except Exception as e:
        print(f"Score Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("\n🚀 Starting FastAPI server on http://127.0.0.1:8000")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)