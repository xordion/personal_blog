import React from "react";
import Link from "next/link";

export default function HomePage({ initialHomeData }) {
  const homeData = initialHomeData;

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
