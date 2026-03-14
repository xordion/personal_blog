import HomePage from "../HomePage";
import fs from "fs";
import path from "path";

const DEFAULT_HOME_DATA = {
  name: "[Your Name]",
  projects: [
    {
      title: "Contract Review Agent",
      description:
        "Intelligent contract review platform with frontend architecture and performance optimization.",
      linkLabel: "View Source",
      link: "https://contract-agent.qfei.cn",
    },
    {
      title: "WPS SDK Wrapper",
      description:
        "React-based SDK wrapper for WebOffice document workflows and integration consistency.",
      linkLabel: "Live Demo",
      link: "https://github.com/xordion/wps-sdk-wrapper",
    },
  ],
  linkedinUrl: "https://www.linkedin.com/in/your-profile",
  email: "your.email@example.com",
};

export async function getStaticProps() {
  let homeData = DEFAULT_HOME_DATA;
  
  try {
    const filePath = path.join(process.cwd(), "public/private/resume.private.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const rawData = JSON.parse(fileContent);
      const contact = rawData?.contact || {};
      
      homeData = {
        name: rawData?.name || DEFAULT_HOME_DATA.name,
        projects:
          Array.isArray(rawData?.homeProjects) && rawData.homeProjects.length > 0
            ? rawData.homeProjects
            : DEFAULT_HOME_DATA.projects,
        linkedinUrl: contact.linkedinUrl || DEFAULT_HOME_DATA.linkedinUrl,
        email: contact.email || DEFAULT_HOME_DATA.email,
      };
    }
  } catch (error) {
    console.error("Failed to load home data:", error);
  }
  
  return {
    props: {
      initialHomeData: homeData,
    },
  };
}

export default function Home({ initialHomeData }) {
  return <HomePage initialHomeData={initialHomeData} />;
}
