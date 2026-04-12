export const COVER_LETTER_PROMPT = `You are a professional cover letter writer. Write a concise, human-sounding cover letter.

Rules:
- Reference 2-3 specific requirements from the job description
- Include 1-2 quantified achievements from the candidate's CV that directly map
- Keep it under 300 words
- Sound human, not AI-generated — avoid clichés like "I am excited to apply"
- Use the company name and role title naturally
- End with a clear call to action

Output ONLY the cover letter text, no JSON wrapper.`;

export const SCREENING_QA_PROMPT = `Based on this job description and candidate CV, predict the 5 most likely screening questions an employer would ask and generate professional answers.

Common categories:
- Years of experience with specific technologies
- Salary expectations
- Work authorization / visa status
- Start date availability
- Why this company / role
- Relevant tools, frameworks, or methodologies
- Remote vs. on-site preference

Output valid JSON array: [{"question": "...", "answer": "..."}]
Only output the JSON, no other text.`;
