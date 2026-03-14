import React, { useEffect, useState } from "react";
import Link from "next/link";

const PRIVATE_RESUME_URL = "/private/resume.private.json";

const DEFAULT_HOME_DATA = {
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

async function loadHomeData() {
  try {
    const response = await fetch(PRIVATE_RESUME_URL, { cache: "no-store" });
    if (!response.ok) return DEFAULT_HOME_DATA;
    const rawData = await response.json();
    const contact = rawData?.contact || {};
    return {
      name: rawData?.name || "[Your Name]",
      projects:
        Array.isArray(rawData?.homeProjects) && rawData.homeProjects.length > 0
          ? rawData.homeProjects
          : DEFAULT_HOME_DATA.projects,
      linkedinUrl: contact.linkedinUrl || DEFAULT_HOME_DATA.linkedinUrl,
      email: contact.email || DEFAULT_HOME_DATA.email,
    };
  } catch (_error) {
    console.error(_error);
    return DEFAULT_HOME_DATA;
  }
}

export default function HomePage() {
  const [homeData, setHomeData] = useState(DEFAULT_HOME_DATA);

  useEffect(() => {
    let cancelled = false;
    loadHomeData().then((data) => {
      if (!cancelled) setHomeData(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="home-page">
      <div className="container">
        <h1>{homeData.name}</h1>
        <p className="subtitle">
          Senior Frontend Engineer / Product Design Enthusiast
        </p>

        <section className="project-grid">
          {homeData.projects.map((item) => (
            <article key={item.title} className="project-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <a href={item.link} target="_blank" rel="noreferrer">
                {item.linkLabel}
              </a>
            </article>
          ))}
        </section>

        <div className="home-actions">
          <Link href="/resume" className="badge-link">
            View Resume
          </Link>
          <a
            className="badge-link"
            href={homeData.linkedinUrl}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a className="badge-link" href={`mailto:${homeData.email}`}>
            Contact Me
          </a>
        </div>
      </div>
    </section>
  );
}
