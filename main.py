

import os
import warnings
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

from crewai import Agent, Task, Crew, Process, LLM
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

# ==========================================
# 1. FASTAPI & STRUCTURAL SETUP
# ==========================================
app = FastAPI(title="AI Resume Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","https://unicorn-backend-opal.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key_str = "AIzaSyDJWXlNnUBEq-JHnt6SHB2DH8TiTd7mZ_k"  # <-- Apni key yahan rakho
os.environ["GEMINI_API_KEY"] = api_key_str
os.environ["GOOGLE_API_KEY"] = api_key_str

gemini_llm = LLM(
    model="gemini/gemini-2.5-flash",
    api_key=api_key_str
)


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
        llm=gemini_llm
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
        llm=gemini_llm
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
        llm=gemini_llm
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

        # CrewAI ke standard LLM call ki tarah, hum direct model initialize kar rahe hain bina extra package ke
        from google.generativeai import GenerativeModel
        import google.generativeai as genai
        
        # API key configure karo (Jo upar api_key_str mein defined hai)
        genai.configure(api_key=api_key_str)

        model = GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        response = model.generate_content(user_content)
        cleaned_response = response.text.strip()
        
        # Agar Gemini markdown backticks ```json lagaye toh use safely remove karo
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response.strip("```").strip("json").strip()

        # Modified text ko dictionary mein convert karke frontend ko return karo
        updated_resume_dict = json.loads(cleaned_response)
        return updated_resume_dict

    except json.JSONDecodeError:
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

if __name__ == "__main__":
    print("\n🚀 Starting FastAPI server on http://127.0.0.1:8000")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)