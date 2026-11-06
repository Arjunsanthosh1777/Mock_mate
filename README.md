# MOCKMATE — AI-Powered Interview Preparation Platform

MOCKMATE is a full-stack interview preparation studio built with **React, TypeScript, Tailwind CSS, Node.js, Express, SQLite, and structured LLM evaluation** (supporting both the **OpenAI API** and **Google Gemini API** through the backend).

---

## 1. Application Architecture

MOCKMATE separates client presentation from AI orchestration and persistent storage:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        React + TypeScript SPA                             │
│  Landing · Dashboard · Setup · Practice · Feedback · Results · History   │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │ HTTP JSON (/api/*)
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                     Express.js + TypeScript Backend                       │
│  REST API Router (/server/routes/api.ts) · Zod Payload Validation        │
└───────────────────┬───────────────────────────────────┬───────────────────┘
                    │                                   │
                    ▼                                   ▼
┌───────────────────────────────────┐ ┌─────────────────────────────────────┐
│   Backend AI Service              │ │   SQLite Persistence Layer          │
│   /server/services/aiService.ts   │ │   /server/db/database.ts            │
│   - OpenAI SDK / Gemini SDK       │ │   - user_preferences                │
│   - Structured JSON Validation    │ │   - interview_sessions              │
│   - Exponential Backoff Retries   │ │   - interview_questions             │
│   - Rate Limit & Error Mapping    │ │   - submitted_answers               │
└───────────────────────────────────┘ │   - ai_feedback                     │
                                      │   - session_statistics              │
                                      └─────────────────────────────────────┘
```

### Folder Structure

- `/server.ts` — Express server entry point mounting `/api` routes and Vite middleware in development (`dist/` static serving in production) on port `3000`.
- `/server/db/database.ts` — SQLite (`node:sqlite` `DatabaseSync`) initialization, WAL mode, foreign keys, schema creation, and CRUD queries.
- `/server/services/prompts.ts` — Role-calibrated question generation, single-question anti-duplication, six-dimension answer evaluation (including STAR and technical reasoning), and session summary prompt templates.
- `/server/services/aiService.ts` — Reusable server-side AI client supporting OpenAI (`OPENAI_API_KEY`) and Gemini (`GEMINI_API_KEY`) with strict Zod runtime validation and retry/rate-limit handling.
- `/server/routes/api.ts` — RESTful Express API endpoints with Zod request validation and standardized error responses.
- `/src/types/interview.ts` — Shared TypeScript interfaces and domain constants (`JOB_ROLES`, `EXPERIENCE_LEVELS`, `INTERVIEW_TYPES`, `DIFFICULTY_LEVELS`).
- `/src/lib/api.ts` — Typed frontend fetch client communicating exclusively with `/api/*`.
- `/src/components/` — Modular UI views (`LandingPage`, `DashboardPage`, `InterviewSetupPage`, `InterviewPracticePage`, `AnswerFeedbackPage`, `InterviewResultsPage`, `InterviewHistoryPage`, `ProfileSettingsPage`, `Charts`, `Navbar`).

---

## 2. Database Documentation (SQLite)

The SQLite database defaults to `./data/mockmate.db` (configurable via `SQLITE_DB_PATH`) with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`.

### Tables

1. **`user_preferences`**: Stores candidate profile (`candidate_name`, `target_headline`), default interview parameters (`default_job_role`, `custom_job_role`, `default_experience`, `default_interview_type`, `default_difficulty`, `default_question_count`), preferred free-tier Gemini model (`preferred_gemini_model`), UI theme (`light` / `dark`), and `focus_notes`.
2. **`interview_sessions`**: Stores session metadata (`id`, `job_role`, `custom_role`, `effective_role`, `experience_level`, `interview_type`, `difficulty`, `target_question_count`, `focus_context`, `status`, `current_question_index`, `ai_provider_used`, `created_at`, `completed_at`).
3. **`interview_questions`**: Stores generated prompts ordered per session (`id`, `session_id`, `question_order`, `question_text`, `topic_tag`, `interviewer_intent`, `expected_signals_json`, `status`, `created_at`).
4. **`submitted_answers`**: Stores candidate responses (`id`, `session_id`, `question_id`, `answer_text`, `character_count`, `word_count`, `submitted_at`).
5. **`ai_feedback`**: Stores six-dimension scores (`relevance_score`, `clarity_score`, `completeness_score`, `structure_score`, `technical_accuracy_score`, `communication_score`), `overall_rating`, `rating_label`, `rating_explanation`, JSON arrays for `strengths`, `weaknesses`, `missing_points`, `improvement_tips`, `example_improved_answer`, optional STAR columns (`star_situation`, `star_task`, `star_action`, `star_result`), optional `technical_reasoning`, and `coaching_disclaimer`.
6. **`session_statistics`**: Stores aggregated session counts (`questions_generated`, `questions_attempted`, `questions_skipped`), average dimension scores, and the holistic end-of-session summary (`overall_feedback`, `strongest_answers_json`, `areas_needing_improvement_json`, `recommended_topics_json`, `suggested_next_session_json`).

---

## 3. Backend API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Checks database readiness and server-side AI provider configuration. |
| `GET` | `/api/preferences` | Retrieves persisted candidate profile and default session preferences. |
| `PUT` | `/api/preferences` | Updates candidate profile, defaults, focus notes, or theme in SQLite. |
| `GET` | `/api/dashboard` | Returns aggregate KPIs, rating trajectory points, 6-dimension averages, and recent sessions. |
| `GET` | `/api/sessions` | Lists all saved interview sessions with statistics. |
| `POST` | `/api/sessions` | Generates non-repetitive AI questions for the selected configuration and creates a session. |
| `GET` | `/api/sessions/:id` | Retrieves full session details, questions, submitted answers, AI feedback, and statistics. |
| `POST` | `/api/sessions/:id/questions/next` | Generates one additional non-repetitive question avoiding existing session prompts. |
| `POST` | `/api/sessions/:id/questions/:questionId/skip` | Marks a question as skipped and recalculates session statistics. |
| `POST` | `/api/sessions/:id/questions/:questionId/answer` | Validates answer text, runs AI 6-dimension evaluation, and persists answer + feedback. |
| `POST` | `/api/sessions/:id/complete` | Finalizes a session and generates the holistic end-of-session summary. |
| `GET` | `/api/sessions/compare?ids=id1,id2` | Returns side-by-side comparison metrics for 2 or more sessions. |
| `DELETE` | `/api/sessions/:id` | Deletes a session and cascades deletion to questions, answers, feedback, and statistics. |

---

## 4. AI Configuration Guide

All AI requests run exclusively on the Node.js backend—API keys are never sent to or stored in the browser.

### Environment Variables (`.env`)

```bash
AI_PROVIDER="auto"                         # "auto", "openai", or "gemini"
OPENAI_API_KEY="sk-..."                    # OpenAI API key (used first in "auto" mode when set)
OPENAI_MODEL="gpt-4o-mini"                 # OpenAI model name
GEMINI_API_KEY="..."                       # Google Gemini API key (automatically injected in AI Studio)
GEMINI_MODEL="gemini-3.1-flash-lite"       # Free-tier Gemini model: "gemini-3.1-flash-lite" or "gemini-3.8-flash"
SQLITE_DB_PATH="./data/mockmate.db"
PORT="3000"
```

### Prompt & Evaluation Design

- **Non-Repetitive Question Generation**: Existing session questions are passed into `buildSingleQuestionPrompt` and deduplicated before saving.
- **Six-Dimension Rubric**: Every answer is scored from `1.0` to `10.0` across *Relevance*, *Clarity*, *Completeness*, *Structure*, *Technical Accuracy*, and *Communication Quality*.
- **Conditional STAR & Technical Analysis**: Behavioral and HR prompts generate a structured *Situation, Task, Action, Result* breakdown; Technical and General prompts generate a technical reasoning and trade-offs critique.
- **Coaching Integrity**: Prompts explicitly instruct the model never to invent technical facts or present subjective coaching feedback as an objective hiring verdict.

---

## 5. Setup & Running Locally

### Prerequisites

- **Node.js 22.13+** (includes built-in `node:sqlite` support)
- **npm 10+**

### Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env to set OPENAI_API_KEY or GEMINI_API_KEY

# 3. Start the full-stack development server (Express + Vite on port 3000)
npm run dev
```

### Production Build & Start

```bash
npm run build
NODE_ENV=production npm start
```

---

## 6. Testing Checklist

1. **TypeScript & Build Verification**: Run `npm run lint` and `npm run build` to verify zero type or bundling errors.
2. **Interview Setup & Question Generation**: Select each role (including `Other` with custom role validation), experience level, interview type, and difficulty; verify non-repetitive questions are generated and saved.
3. **Answer Practice & Validation**: Test empty/short answer validation (`< 10` characters), character/word counters, `"Request Another Question"`, `"Skip Question"`, and `"Previous Question"` / `"Next Question"` navigation.
4. **AI Evaluation (STAR & Technical)**: Submit answers to both Behavioral/HR and Technical sessions; verify 6-dimension scores, STAR breakdown, technical reasoning, strengths, weaknesses, missing points, improvement tips, and example improved answer render accurately.
5. **Session Completion & History Persistence**: Complete a session to inspect the summary report, select 2+ sessions in Interview History to compare metrics side by side, delete a session, and restart the server to confirm SQLite persistence.
