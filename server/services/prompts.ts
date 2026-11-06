import type {
  DifficultyLevel,
  ExperienceLevel,
  InterviewType,
  SessionQuestionItem,
} from '../../src/types/interview.ts';

export const INTERVIEWER_SYSTEM_INSTRUCTION = `You are a seasoned, fair, and deeply knowledgeable interview coach and technical/behavioral assessor for MOCKMATE.
Your responsibility is to generate realistic, role-calibrated interview questions, provide constructive structured answer evaluations, and synthesize holistic session summaries.

Strict Integrity & Accuracy Principles:
1. Never invent technical facts, non-existent APIs, fake benchmarks, or fabricated industry statistics.
2. Never present subjective interview feedback as an objective hiring decision, pass/fail verdict, or guarantee of employment. Frame all feedback as constructive coaching to help the candidate improve.
3. Calibrate expectations honestly to the candidate's stated experience level (Fresher, Beginner, Intermediate, Experienced) and difficulty tier (Easy, Medium, Hard).
4. Return strictly valid JSON conforming exactly to the requested schema.`;

export function buildQuestionBatchPrompt(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  count: number;
  focusContext: string;
  existingQuestions?: string[];
}): string {
  const existingBlock =
    params.existingQuestions && params.existingQuestions.length > 0
      ? `\nAvoid repeating or paraphrasing any of these already-asked questions:\n${params.existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}`
      : '';

  const focusBlock = params.focusContext.trim()
    ? `\nCandidate's Optional Focus Context: "${params.focusContext.trim()}"`
    : '';

  return `Generate ${params.count} distinct, high-signal interview questions for the following candidate profile:
- Target Role: ${params.effectiveRole}
- Experience Level: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Difficulty Level: ${params.difficulty}${focusBlock}${existingBlock}

Calibration Guidelines:
- For "Fresher" or "Beginner": Focus on foundational concepts, clear reasoning, learning agility, debugging basics, and structured communication without assuming years of production architecture ownership.
- For "Intermediate": Focus on practical production implementation, trade-offs, state/data modeling, testing, collaboration, and problem solving.
- For "Experienced": Focus on system design, scalability, architectural trade-offs, mentorship, ambiguity resolution, and high-impact decision-making.
- For "Behavioral" or "HR" interviews: Craft open-ended situational and past-experience prompts well-suited to the STAR method (Situation, Task, Action, Result).
- For "Technical" interviews: Craft conceptual, architectural, debugging, or practical engineering questions relevant to ${params.effectiveRole}.
- For "General" interviews: Blend role-specific technical thinking, collaboration, and career/situational reasoning.

Return a JSON object with a single key "questions" containing an array of ${params.count} objects, each with:
- "questionText": Clear, natural interview prompt as spoken by an interviewer.
- "topicTag": Concise 2-4 word topic label (e.g., "Asynchronous State Management", "Conflict Resolution").
- "interviewerIntent": 1-2 sentences explaining what capability or mindset this question assesses.
- "expectedSignals": Array of 3 to 5 specific points or signals a strong response should cover.`;
}

export function buildSingleQuestionPrompt(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  focusContext: string;
  existingQuestions: string[];
}): string {
  const focusBlock = params.focusContext.trim()
    ? `\nCandidate's Optional Focus Context: "${params.focusContext.trim()}"`
    : '';

  const existingBlock =
    params.existingQuestions.length > 0
      ? `\nYou MUST NOT repeat, overlap with, or paraphrase any of these existing questions in this session:\n${params.existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}`
      : '';

  return `Generate 1 fresh, distinct interview question for this ongoing practice session:
- Target Role: ${params.effectiveRole}
- Experience Level: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Difficulty Level: ${params.difficulty}${focusBlock}${existingBlock}

Return a JSON object with:
- "questionText": Clear, natural interview question.
- "topicTag": Concise 2-4 word topic label.
- "interviewerIntent": 1-2 sentences explaining what this question evaluates.
- "expectedSignals": Array of 3 to 5 specific signals a strong answer demonstrates.`;
}

export function buildAnswerEvaluationPrompt(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  questionText: string;
  expectedSignals: string[];
  answerText: string;
}): string {
  const isBehavioralOrHr =
    params.interviewType === 'Behavioral' || params.interviewType === 'HR';
  const isTechnicalOrGeneral =
    params.interviewType === 'Technical' || params.interviewType === 'General';

  return `Evaluate the candidate's interview answer objectively and constructively.

Interview Context:
- Role: ${params.effectiveRole}
- Experience Level: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Difficulty: ${params.difficulty}

Interview Question:
"${params.questionText}"

Key Interviewer Signals Expected:
${params.expectedSignals.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Candidate's Submitted Answer:
"""
${params.answerText}
"""

Evaluation Instructions:
Score each of the following 6 dimensions from 1.0 to 10.0 (one decimal place allowed):
1. "relevance": How directly and accurately the response addresses the prompt.
2. "clarity": How clear, concise, and easy to follow the explanation is.
3. "completeness": How thoroughly the response covers key nuances and expected signals.
4. "structure": Logical organization and progression of ideas.
5. "technicalAccuracy": Correctness of technical concepts, terminology, and reasoning (for non-technical HR/behavioral questions, evaluate domain/process accuracy and logical soundness).
6. "communicationQuality": Professional tone, confidence, specificity, and articulation.

Also provide:
- "overallRating": Overall practice score from 1.0 to 10.0.
- "ratingLabel": Short descriptive tier such as "Needs Foundation", "Developing", "Solid Contender", "Strong Response", or "Exemplary".
- "ratingExplanation": 2-3 clear sentences explaining why this score was earned and how it reflects ${params.experienceLevel}-level expectations.
- "strengths": Array of 2 to 4 specific strengths observed in the candidate's actual wording.
- "weaknesses": Array of 1 to 4 specific weaknesses or gaps in the answer.
- "missingPoints": Array of 1 to 4 important concepts, details, or examples that were omitted.
- "improvementTips": Array of 2 to 4 concrete, actionable tips the candidate can apply on their next attempt.
- "exampleImprovedAnswer": A realistic, well-structured example answer tailored to a ${params.experienceLevel} ${params.effectiveRole} candidate (do not invent fake metrics; use realistic framing).
- "starBreakdown": ${
    isBehavioralOrHr
      ? `An object evaluating STAR components in the candidate's answer with keys "situation", "task", "action", "result" (each a 1-2 sentence assessment noting what was present or missing).`
      : `null (or if the candidate used a story, an optional STAR object; otherwise null).`
  }
- "technicalReasoning": ${
    isTechnicalOrGeneral
      ? `A 2-4 sentence evaluation of technical accuracy, edge cases, trade-offs, and problem-solving reasoning.`
      : `null`
  }
- "coachingDisclaimer": A brief 1-sentence reminder that this evaluation is AI-generated practice feedback intended for skill development and does not constitute an objective hiring decision.`;
}

export function buildSessionSummaryPrompt(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  items: SessionQuestionItem[];
}): string {
  const transcript = params.items
    .map((item) => {
      const q = item.question;
      if (q.status === 'skipped') {
        return `Q${q.questionOrder} [${q.topicTag}] — SKIPPED\nQuestion: ${q.questionText}`;
      }
      if (!item.answer || !item.feedback) {
        return `Q${q.questionOrder} [${q.topicTag}] — UNANSWERED\nQuestion: ${q.questionText}`;
      }
      return `Q${q.questionOrder} [${q.topicTag}] — Rating: ${item.feedback.overallRating}/10 (${item.feedback.ratingLabel})
Question: ${q.questionText}
Candidate Answer: ${item.answer.answerText}
Strengths: ${item.feedback.strengths.join('; ')}
Missing Points: ${item.feedback.missingPoints.join('; ')}`;
    })
    .join('\n\n---\n\n');

  return `Synthesize an end-of-session interview coaching summary for this completed practice session.

Session Profile:
- Role: ${params.effectiveRole}
- Experience Level: ${params.experienceLevel}
- Interview Type: ${params.interviewType}
- Difficulty: ${params.difficulty}

Session Transcript & Per-Question Evaluations:
${transcript}

Return a JSON object with:
- "overallFeedback": 3-4 sentences summarizing overall readiness, communication patterns, and performance trajectory across the session (remember: frame strictly as constructive practice coaching, never an objective hiring verdict).
- "strongestAnswers": Array of 1 to 3 specific highlights referencing which questions were strongest and why.
- "areasNeedingImprovement": Array of 2 to 4 recurring themes or gaps to work on.
- "recommendedTopics": Array of 3 to 5 specific technical or behavioral study topics tailored to this candidate's performance.
- "suggestedNextPracticeSession": An object recommending the next practice configuration with:
  - "jobRole": One of "Frontend Developer", "Backend Developer", "Full Stack Developer", "Java Developer", "Python Developer", "Data Analyst", "Software Tester", "Other"
  - "customRole": String (empty unless jobRole is "Other")
  - "experienceLevel": One of "Fresher", "Beginner", "Intermediate", "Experienced"
  - "interviewType": One of "HR", "Technical", "Behavioral", "General"
  - "difficulty": One of "Easy", "Medium", "Hard"
  - "rationale": 1-2 sentences explaining why this next practice session is recommended.`;
}
