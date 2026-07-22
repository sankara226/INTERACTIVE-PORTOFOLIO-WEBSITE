from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow the static frontend (served from a different origin, e.g. GitHub
# Pages or file://) to call this API. No cookies/auth are used here, so a
# wildcard origin with credentials disabled is safe.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECTS = [
    {
        "id": 1,
        "name": "Hallucination Detector Guide",
        "description": "Learned about AI hallucinations and how to detect them. Built a comprehensive guide "
                        "with real examples of failure modes and how to catch them before they ship.",
        "tags": ["Claude", "Prompt Engineering", "AI Safety"],
        "repo_url": "https://github.com/sankara226/CLAUDE-CODE-STARTER-KIT",
    },
    {
        "id": 2,
        "name": "Prompt Library",
        "description": "Created a collection of reusable prompts following the CONTEXT → TASK → FORMAT "
                        "structure, built for consistency and reuse across projects.",
        "tags": ["Claude", "Prompt Design", "Documentation"],
        "repo_url": "https://github.com/sankara226/PROMPT-LIBRARY",
    },
    {
        "id": 3,
        "name": "Data Pipeline Automation",
        "description": "Built a multi-file Python project that automates data cleaning, analysis, and "
                        "reporting end-to-end — from raw input to a finished report.",
        "tags": ["Python", "Automation", "Data Analysis"],
        "repo_url": "https://github.com/sankara226/DATA-PIPELINE-AUTOMATION",
    },
    {
        "id": 4,
        "name": "Marketing Analysis",
        "description": "Analyzed campaign and customer data to surface actionable marketing insights, "
                        "turning raw metrics into clear, decision-ready reporting.",
        "tags": ["Data Analysis", "SQLite", "Marketing"],
        "repo_url": "https://github.com/sankara226/MARKETING-ANALYSIS",
    },
]


class Feedback(BaseModel):
    name: str
    email: str
    message: str


@app.get("/")
def read_root():
    return {"message": "Welcome to my API"}


@app.get("/api/projects")
def get_projects():
    return {"projects": PROJECTS}


@app.get("/api/projects/{project_id}")
def get_project(project_id: int):
    for project in PROJECTS:
        if project["id"] == project_id:
            return project
    return {"error": "Project not found"}


@app.post("/api/feedback/")
def submit_feedback(feedback: Feedback):
    # No database here yet — this just proves the frontend and backend
    # can talk to each other. A real app would persist this somewhere.
    print(f"Feedback received from {feedback.name} <{feedback.email}>: {feedback.message}")
    return {"status": "success", "message": "Thank you for your feedback!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
