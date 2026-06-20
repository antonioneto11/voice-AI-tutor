import { promises as fs } from "fs";
import path from "path";

type RetrievedSection = {
  source: string;
  title: string;
  content: string;
};

const retrievalMap = [
  {
    keywords: ["llm harness", "harness"],
    file: "llm_harness.md"
  },
  {
    keywords: ["rubric", "gold set", "label", "benchmark", "eval", "evaluation", "adjudication"],
    file: "evals.md"
  },
  {
    keywords: ["agent", "agentic", "workflow", "orchestration", "tool use", "memory"],
    file: "agentic_systems.md"
  },
  {
    keywords: ["guardrail", "monitoring", "drift", "failure mode"],
    file: "guardrails.md"
  },
  {
    keywords: ["rag", "retrieval"],
    file: "rag.md"
  },
  {
    keywords: ["interview", "product strategy", "throughput", "leadership"],
    file: "interview_answers.md"
  }
];

async function readKnowledgeFile(fileName: string) {
  const filePath = path.join(process.cwd(), "knowledge", fileName);
  return fs.readFile(filePath, "utf8");
}

function extractSections(markdown: string, fileName: string) {
  const sections = markdown
    .split(/^## /gm)
    .map((section, index) => {
      if (index === 0) {
        return {
          source: fileName,
          title: "Overview",
          content: section.trim()
        };
      }

      const [title, ...rest] = section.split("\n");
      return {
        source: fileName,
        title: title.trim(),
        content: rest.join("\n").trim()
      };
    })
    .filter((section) => section.content);

  return sections;
}

export async function retrieveKnowledge(question: string) {
  const normalized = question.toLowerCase();
  const matchedFiles = retrievalMap
    .filter((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)))
    .map((entry) => entry.file);

  const files = matchedFiles.length ? [...new Set(matchedFiles)] : ["agentic_systems.md", "evals.md"];

  // TODO: Replace keyword routing with OpenAI File Search or a vector store when the MVP evolves.
  const loaded = await Promise.all(
    files.map(async (file) => {
      const markdown = await readKnowledgeFile(file);
      return extractSections(markdown, file);
    })
  );

  const sections = loaded.flat();
  const ranked = sections
    .map((section) => {
      const score = normalized
        .split(/\W+/)
        .filter(Boolean)
        .reduce((total, token) => total + (section.content.toLowerCase().includes(token) ? 1 : 0), 0);

      return { ...section, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    snippets: ranked,
    names: ranked.map((item) => `${item.source} · ${item.title}`)
  };
}

export function buildRetrievedContext(sections: RetrievedSection[]) {
  return sections
    .map((section) => `Source: ${section.source}\nSection: ${section.title}\n${section.content}`)
    .join("\n\n---\n\n");
}
