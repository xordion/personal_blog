import React, { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createComment, fetchComments } from "../../api";
import { DEFAULT_RESUME_DATA } from "./defaultResumeData";
import type {
  CommentRow,
  FloatPos,
  PrivateResumeData,
  ResumeData,
} from "./types";

const PAGE_KEY = "resume";
const MAX_QUOTE_LENGTH = 260;
const PRIVATE_RESUME_URL = "/private/resume.private.json";

function buildResumeData(data: PrivateResumeData = {}): ResumeData {
  return {
    ...DEFAULT_RESUME_DATA,
    ...data,
    contact: {
      ...DEFAULT_RESUME_DATA.contact,
      ...(data.contact || {}),
    },
    skills: data.skills || DEFAULT_RESUME_DATA.skills,
    experience: data.experience || DEFAULT_RESUME_DATA.experience,
  };
}

async function loadPrivateResumeDataFromPublic(): Promise<ResumeData> {
  try {
    const response = await fetch(PRIVATE_RESUME_URL, { cache: "no-store" });
    if (!response.ok) {
      return DEFAULT_RESUME_DATA;
    }
    const json = (await response.json()) as PrivateResumeData;
    return buildResumeData(json || {});
  } catch (_error) {
    console.error(_error);
    return DEFAULT_RESUME_DATA;
  }
}

function normalize(text: unknown): string {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function quoted(text: string): string {
  if (!text) return "";
  return `"${normalize(text).slice(0, MAX_QUOTE_LENGTH)}"`;
}

export default function ResumePage() {
  const [resumeData, setResumeData] = useState<ResumeData>(() =>
    buildResumeData({})
  );
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [status, setStatus] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [selectionQuote, setSelectionQuote] = useState("");
  const [triggerPos, setTriggerPos] = useState<FloatPos>({
    left: 0,
    top: 0,
    visible: false,
  });
  const [popoverPos, setPopoverPos] = useState<FloatPos>({
    left: 0,
    top: 0,
    visible: false,
  });
  const [popoverInput, setPopoverInput] = useState("");
  const [bottomInput, setBottomInput] = useState("");

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const resumePanelRef = useRef<HTMLElement | null>(null);
  const resumePageRef = useRef<HTMLElement | null>(null);

  const showStatus = useCallback((message: string, isError = false) => {
    setStatus(message);
    setStatusError(isError);
  }, []);

  const toPageRelativePos = useCallback((left: number, top: number) => {
    const pageRect = resumePageRef.current?.getBoundingClientRect();
    if (!pageRect) {
      return { left, top };
    }
    return {
      left: left - pageRect.left,
      top: top - pageRect.top,
    };
  }, []);

  const loadComments = useCallback(async () => {
    try {
      const rows = await fetchComments(PAGE_KEY);
      setComments(rows || []);
      showStatus("");
    } catch (_error) {
      console.error(_error);
      showStatus(
        "Comment service is temporarily unavailable, please try again later.",
        true
      );
    }
  }, [showStatus]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    let cancelled = false;
    loadPrivateResumeDataFromPublic()
      .then((data) => {
        if (!cancelled) {
          setResumeData(data);
        }
      })
      .catch((_error) => {
        console.error(_error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submitComment = useCallback(
    async ({ content, quote }: { content: string; quote: string }) => {
      const normalizedContent = normalize(content);
      if (!normalizedContent) {
        showStatus("Comment content cannot be empty.", true);
        return false;
      }
      try {
        await createComment({
          page: PAGE_KEY,
          content: normalizedContent,
          quote: normalize(quote || ""),
        });
        showStatus("Comment submitted.", false);
        await loadComments();
        return true;
      } catch (_error) {
        console.error(_error);
        showStatus("Submission failed, please try again later.", true);
        return false;
      }
    },
    [loadComments, showStatus]
  );

  useEffect(() => {
    function handleMouseUp(event: MouseEvent) {
      const target = event.target as Element | null;
      const clickedOnTrigger = !!target?.closest?.(
        ".selection-comment-trigger"
      );
      const clickedInsidePopover = !!target?.closest?.(".comment-popover");
      if (clickedOnTrigger || clickedInsidePopover) {
        return;
      }

      window.setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          setTriggerPos((prev) => ({ ...prev, visible: false }));
          if (!popoverPos.visible) {
            setSelectionQuote("");
          }
          return;
        }

        const text = normalize(selection.toString());
        if (!text) {
          setTriggerPos((prev) => ({ ...prev, visible: false }));
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) {
          return;
        }

        setSelectionQuote(text);
        const nextPos = toPageRelativePos(rect.left, rect.bottom + 8);
        setTriggerPos({
          left: nextPos.left,
          top: nextPos.top,
          visible: true,
        });
      }, 0);
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const inPopover = !!target?.closest?.(".comment-popover");
      const inTrigger = !!target?.closest?.(".selection-comment-trigger");
      if (inPopover || inTrigger) {
        return;
      }
      setPopoverPos((prev) => ({ ...prev, visible: false }));
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [popoverPos.visible]);

  const onPopoverSubmit = useCallback(async () => {
    const ok = await submitComment({
      content: popoverInput,
      quote: selectionQuote,
    });
    if (!ok) return;
    setPopoverInput("");
    setPopoverPos((prev) => ({ ...prev, visible: false }));
    setTriggerPos((prev) => ({ ...prev, visible: false }));
    setSelectionQuote("");
    window.getSelection()?.removeAllRanges();
  }, [popoverInput, selectionQuote, submitComment]);

  const onBottomSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const ok = await submitComment({ content: bottomInput, quote: "" });
      if (ok) {
        setBottomInput("");
      }
    },
    [bottomInput, submitComment]
  );

  const onOpenPopover = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl || !selectionQuote) return;
    const rect = triggerEl.getBoundingClientRect();
    const nextPos = toPageRelativePos(rect.left, rect.bottom + 6);
    setPopoverPos({
      left: nextPos.left,
      top: nextPos.top,
      visible: true,
    });
    setPopoverInput("");
  }, [selectionQuote, toPageRelativePos]);

  const onPrintResume = useCallback(() => {
    const panel = resumePanelRef.current;
    if (!panel) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      document.body.removeChild(iframe);
      showStatus("Export failed, please try again later.", true);
      return;
    }

    const styleNodes = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    );
    const styleMarkup = styleNodes.map((node) => node.outerHTML).join("\n");

    frameWindow.document.open();
    frameWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Resume Export</title>
    ${styleMarkup}
    <style>
      body { margin: 0; padding: 0; background: #fff; }
      .resume-export { font-size: 12px; color: var(--text); }
      .resume-export h2 {
        margin: 0 0 12px;
        border-bottom: 2px solid var(--accent);
        color: var(--accent);
        text-transform: uppercase;
        font-size: 1.06em;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <section class="resume-export">${panel.innerHTML}</section>
  </body>
</html>`);
    frameWindow.document.close();

    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 800);
    }, 200);
  }, [showStatus]);

  return (
    <section ref={resumePageRef} className="resume-page">
      <div className="row-end resume-print-actions">
        <button
          type="button"
          className="primary-btn resume-print-btn"
          onClick={onPrintResume}
        >
          Export PDF (Resume Only)
        </button>
      </div>

      <section ref={resumePanelRef} className="resume-panel">
        <section className="resume-block resume-intro">
          <div className="resume-intro-main">
            <h1>
              Hayden Wu{" "}
              <span className="job-title">Senior Frontend Engineer</span>
            </h1>
            <p className="contact-info">
              Email:{" "}
              <a href={`mailto:${resumeData.contact.email}`}>
                {resumeData.contact.email}
              </a>{" "}
              | Phone: {resumeData.contact.phone} | Location:{" "}
              {resumeData.contact.location}
            </p>
            <p className="contact-info">
              <a
                href={resumeData.contact.linkedinUrl}
                target="_blank"
                rel="noreferrer"
              >
                {resumeData.contact.linkedinLabel}
              </a>{" "}
              |{" "}
              <a
                href={resumeData.contact.blogUrl}
                target="_blank"
                rel="noreferrer"
              >
                {resumeData.contact.blogLabel}
              </a>
            </p>
          </div>
          <div className="resume-avatar-wrap" aria-hidden="true">
            <img className="resume-avatar" src="/private/portrait.jpg" alt="Portrait" />
          </div>
        </section>
        <section className="visa-info">
          <strong>Visa Status:</strong> {resumeData.visaStatus}
        </section>

        <section className="resume-block">
          <h2>Professional Summary</h2>
          <p>{resumeData.summary}</p>
        </section>

        <section className="resume-block">
          <h2>Core Skills</h2>
          <div className="skills-grid">
            {resumeData.skills.map(([label, text]) => (
              <div key={label} className="skill-item">
                <strong>{label}:</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-block">
          <h2>Work Experience</h2>
          {resumeData.experience.map((item) => (
            <div
              key={`${item.date}-${item.company}`}
              className="experience-item"
            >
              <div className="exp-date">{item.date}</div>
              <div className="exp-content">
                <div className="exp-header">{item.company}</div>
                {item.role ? <div className="exp-sub">{item.role}</div> : null}
                {item.projects ? (
                  <div className="exp-projects">
                    <strong>Projects:</strong> {item.projects}
                  </div>
                ) : null}
                {item.bullets.length > 0 ? (
                  <ul className="exp-list">
                    {item.bullets.map((bullet, index) => (
                      <li
                        key={
                          typeof bullet === "string"
                            ? bullet
                            : `${bullet.label}-${index}`
                        }
                      >
                        {typeof bullet === "string" ? (
                          bullet
                        ) : (
                          <>
                            <strong>{bullet.label}:</strong> {bullet.text}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {item.tags ? <div className="exp-tags">{item.tags}</div> : null}
              </div>
            </div>
          ))}
        </section>

        <section className="resume-block">
          <h2>Education</h2>
          <div className="education-item">
            <div className="exp-header">
              Changchun University of Science and Technology
              <span className="education-year">2010 – 2014</span>
            </div>
            <div>Bachelor's Degree</div>
            <div className="exp-sub">
              Note: Anabin H+ Recognized Institution
            </div>
          </div>
        </section>

        <section className="resume-block">
          <h2>Languages</h2>
          <div className="lang-section">
            <div>
              <strong>Chinese / Shanghainese:</strong> Native
            </div>
            <div>
              <strong>English:</strong> C1
            </div>
            <div>
              <strong>German:</strong> A1
            </div>
          </div>
        </section>

        <section className="resume-block">
          <h2>Hobbies</h2>
          <div className="lang-section">
            <div>Heavy Lifting | Hema | Video Games</div>
          </div>
        </section>
      </section>

      <section className="comments-section">
        <h2>Comments</h2>
        <form onSubmit={onBottomSubmit} className="bottom-comment-form">
          <textarea
            value={bottomInput}
            onChange={(event) => setBottomInput(event.target.value)}
            maxLength={500}
            placeholder="Type your comment here"
          />
          <div className="row-end">
            <button type="submit" className="primary-btn">
              Submit Comment
            </button>
          </div>
        </form>

        <p className={`status ${statusError ? "error" : ""}`}>{status}</p>

        <div className="comment-list">
          {comments.length === 0 ? (
            <p className="comment-empty">
              No comments yet. Be the first to leave one.
            </p>
          ) : null}
          {comments.map((item) => (
            <article key={item.id} className="comment-card">
              {item.quote ? (
                <p className="quote">{quoted(item.quote)}</p>
              ) : null}
              <p className="body">{item.content}</p>
              <p className="meta">
                {item.author} · {new Date(item.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>

      <button
        ref={triggerRef}
        type="button"
        className="selection-comment-trigger"
        style={{
          left: `${triggerPos.left}px`,
          top: `${triggerPos.top}px`,
          display: triggerPos.visible ? "inline-flex" : "none",
        }}
        onClick={onOpenPopover}
      >
        Comment Selection
      </button>

      <div
        className="comment-popover"
        style={{
          left: `${popoverPos.left}px`,
          top: `${popoverPos.top}px`,
          display: popoverPos.visible ? "block" : "none",
        }}
      >
        <h3>Comment Selection</h3>
        <p className="quote-preview">{quoted(selectionQuote)}</p>
        <textarea
          value={popoverInput}
          onChange={(event) => setPopoverInput(event.target.value)}
          maxLength={500}
          placeholder="Enter your comment"
        />
        <div className="row-end with-gap">
          <button
            type="button"
            className="ghost-btn"
            onClick={() =>
              setPopoverPos((prev) => ({ ...prev, visible: false }))
            }
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={onPopoverSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </section>
  );
}
