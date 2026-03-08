export type SkillItem = [string, string];

export type ExperienceItem = {
  date: string;
  company: string;
  role: string;
  bullets: string[];
  tags: string;
};

export type ResumeData = {
  summary: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    linkedinLabel: string;
  };
  visaStatus: string;
  skills: SkillItem[];
  experience: ExperienceItem[];
};

export type PrivateResumeData = Partial<Omit<ResumeData, "contact">> & {
  contact?: Partial<ResumeData["contact"]>;
};

export type CommentRow = {
  id: string | number;
  quote?: string;
  content: string;
  author: string;
  createdAt: string | number | Date;
};

export type FloatPos = {
  left: number;
  top: number;
  visible: boolean;
};
