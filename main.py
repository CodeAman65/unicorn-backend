# import os
# import warnings
# warnings.filterwarnings("ignore", category=UserWarning)

# from crewai import Agent, Task, Crew, Process,LLM
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel, Field
# from typing import List
# import uvicorn

# # ==========================================
# # 1. FASTAPI & STRUCTURAL SETUP
# # ==========================================
# app = FastAPI(title="AI Resume Builder API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000" , "http://127.0.0.1:3000"],  # Next.js frontend port
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Crucial Environment Variables for CrewAI (Using Gemini)
# # os.environ["GEMINI_API_KEY"] = "AIzaSyA1AIJ8Nb76icwJBm3SyHsWGYwMf-yJc5Q"  # Apni sahi key check kar lena bhai
# # os.environ["MODEL"] = "gemini/gemini-1.5-flash"  # CrewAI standard model setup
# # API Key verify karne ke liye safe initialization
# api_key_str = "AIzaSyA1AIJ8Nb76icwJBm3SyHsWGYwMf-yJc5Q"
# os.environ["GEMINI_API_KEY"] = api_key_str
# os.environ["GOOGLE_API_KEY"] = api_key_str

# # CrewAI ka official native wrapper configure karein jo v1beta endpoint issues ko bypass karega
# gemini_llm = LLM(
#     model="gemini/gemini-2.5-flash",  # Latest Gemini model for best performance
#     api_key=api_key_str
# )
# # Frontend Data Formats
# class ResumeRequest(BaseModel):
#     profile: str  # Frontend textbox content
#     jd: str       # Frontend job description text

# # Pydantic Schemas taaki CrewAI ka output seedha JSON me mile
# class ExperienceItem(BaseModel):
#     role: str = Field(..., description="Role Title @ Company Name")
#     duration: str = Field(..., description="Start Date – End Date")
#     points: List[str] = Field(..., description="ATS-optimized bullet points starting with action verbs")

# class ResumeSchema(BaseModel):
#     name: str = Field(..., description="User's full name extracted from profile")
#     contact: str = Field(..., description="Phone • Email • LinkedIn formatted string")
#     summary: str = Field(..., description="A 2-3 sentence highly tailored professional summary matching the JD")
#     experience: List[ExperienceItem] = Field(..., description="List of work experiences tailored to JD")
#     skills: List[str] = Field(..., description="List of skills extracted and matched to JD")


# # ==========================================
# # 2. CREWAI MULTI-AGENT LOGIC
# # ==========================================
# def generate_professional_resume(user_input: str, job_description: str):
    
#     # Agents initialization
#     data_extractor = Agent(
#         role='Career Data Architect',
#         goal='Extract and structure every meaningful skill, project, and metric from raw user input.',
#         backstory="Expert at interviewing candidates and parsing messy, informal text into clean data.",
#         verbose=True,
#         allow_delegation=False,
#         llm=gemini_llm  # Explicitly using the configured Gemini LLM for this agent
#     )

#     resume_writer = Agent(
#         role='Elite Executive Resume Writer',
#         goal='Draft a world-class, customized resume tailored strictly to the provided Job Description.',
#         backstory="Former FAANG recruiter who writes high-impact bullet points using quantifiable metrics.",
#         verbose=True,
#         allow_delegation=False,
#         llm=gemini_llm  # Explicitly using the configured Gemini LLM for this agent
#     )

#     ats_reviewer = Agent(
#         role='ATS Optimization Specialist',
#         goal='Audit the drafted resume against the JD, ensure 85%+ keyword match, and output final polished data structure.',
#         backstory="Ruthless Applicant Tracking System (ATS) expert ensuring keyword compliance and professional JSON formatting.",
#         verbose=True,
#         allow_delegation=False,
#         llm=gemini_llm  # Explicitly using the configured Gemini LLM for this agent
#     )

#     # Tasks Setup
#     extract_task = Task(
#         description=f'Analyze this raw user data:\n{user_input}\n\nExtract all skills, education, and experiences.',
#         expected_output='A structured summary of the user\'s background.',
#         agent=data_extractor
#     )

#     write_task = Task(
#         description=f'Using the extracted data, draft a resume tailored for this Job Description:\n{job_description}\n\nFocus on achievements and impact.',
#         expected_output='A full professional draft of the resume.',
#         agent=resume_writer
#     )

#     review_task = Task(
#         description='Review the draft against the target JD. Optimize keywords, ensure everything perfectly aligns, and match the specified Pydantic schema structure.',
#         expected_output='The final optimized resume mapped directly to the ResumeSchema structure.',
#         agent=ats_reviewer,
#         output_json=ResumeSchema  # ✨ YEH SABSE ZAROORI HAI! Yeh pure output ko ek JSON object bana dega
#     )

#     # Crew Activation
#     resume_crew = Crew(
#         agents=[data_extractor, resume_writer, ats_reviewer],
#         tasks=[extract_task, write_task, review_task],
#         process=Process.sequential
#     )

#     crew_output = resume_crew.kickoff()
    
#     # CrewAI automatically stores JSON inside json_dict if output_json is passed
#     return crew_output.json_dict


# # ==========================================
# # 3. FASTAPI ENDPOINT FOR NEXT.JS
# # ==========================================
# @app.post("/api/generate-resume")
# async def build_resume_endpoint(data: ResumeRequest):
#     if not data.profile or not data.jd:
#         raise HTTPException(status_code=400, detail="Bhai, profile aur JD dono fill karna zaroori hai!")
        
#     try:
#         # CrewAI pipeline call karke seedha JSON data pull karenge
#         resume_data = generate_professional_resume(data.profile, data.jd)
#         return resume_data  # Next.js ko direct pure structured JSON object milega
        
#     except Exception as e:
#         print(f"Server Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"AI generation pipeline failed: {str(e)}")


# if __name__ == "__main__":
#     print("\n🚀 Starting FastAPI local server...")
#     uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)



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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key_str = "AIzaSyA1AIJ8Nb76icwJBm3SyHsWGYwMf-yJc5Q"  # <-- Apni key yahan rakho
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


if __name__ == "__main__":
    print("\n🚀 Starting FastAPI server on http://127.0.0.1:8000")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)