import ResumePage from "../resume";
import type { ResumeData } from "../resume/types";
import { DEFAULT_RESUME_DATA } from "../resume/defaultResumeData";
import fs from "fs";
import path from "path";

interface ResumePageProps {
  initialResumeData: ResumeData;
}

export async function getStaticProps() {
  let resumeData = DEFAULT_RESUME_DATA;
  
  try {
    const filePath = path.join(process.cwd(), "public/private/resume.private.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const privateData = JSON.parse(fileContent);
      
      resumeData = {
        ...DEFAULT_RESUME_DATA,
        ...privateData,
        contact: {
          ...DEFAULT_RESUME_DATA.contact,
          ...(privateData.contact || {}),
        },
        skills: privateData.skills || DEFAULT_RESUME_DATA.skills,
        experience: privateData.experience || DEFAULT_RESUME_DATA.experience,
        languages: privateData.languages || DEFAULT_RESUME_DATA.languages,
        hobbies: privateData.hobbies || DEFAULT_RESUME_DATA.hobbies,
      };
    }
  } catch (error) {
    console.error("Failed to load private resume data:", error);
  }
  
  return {
    props: {
      initialResumeData: resumeData,
    },
  };
}

export default function ResumePageWrapper({ initialResumeData }: ResumePageProps) {
  return <ResumePage initialResumeData={initialResumeData} />;
}
