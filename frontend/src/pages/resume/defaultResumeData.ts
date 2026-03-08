import type { ResumeData } from "./types";

export const DEFAULT_RESUME_DATA: ResumeData = {
  summary:
    "Please create frontend/src/private/resume.private.json to provide your personal summary.",
  contact: {
    email: "your.email@example.com",
    phone: "+00 000000000",
    location: "Your City",
    linkedinUrl: "https://www.linkedin.com/in/your-profile",
    linkedinLabel: "LinkedIn Profile",
  },
  visaStatus: "Add your visa status here.",
  skills: [
    ["Technical Stack", "Add your stack here"],
    ["Quality Assurance", "Add your testing and QA experience here"],
  ],
  experience: [
    {
      date: "YYYY/MM - Present",
      company: "Your Company, City",
      role: "Your Role",
      bullets: ["Describe your impact with measurable outcomes."],
      tags: "React|TypeScript|Webpack",
    },
  ],
};
