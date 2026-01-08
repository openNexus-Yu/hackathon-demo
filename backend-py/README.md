# Python FastAPI Backend for Developer Platform

Python backend with AI chat capabilities for searching Matrix chat room messages.

## Setup

```bash
cd backend-py
conda activate langchain1_env
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and fill in the values (or copy from `backend-ts-legacy/.env`).

## Run

```bash
conda activate langchain1_env
uvicorn app.main:app --reload --port 3000
```

## API Docs

- Swagger: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc
