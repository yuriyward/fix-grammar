/**
 * Markdown + YAML frontmatter parsing/serialization for skill import/export.
 * Uses simple delimiter splitting — no heavy YAML dependency.
 */

const FRONTMATTER_DELIMITER = '---';

interface SkillFrontmatter {
  name: string;
  description: string;
}

interface ParsedSkillMarkdown {
  name: string;
  description: string;
  prompt: string;
}

export function parseSkillMarkdown(markdown: string): ParsedSkillMarkdown {
  const trimmed = markdown.trim();

  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) {
    throw new Error('Invalid skill markdown: missing frontmatter');
  }

  const endIndex = trimmed.indexOf(
    FRONTMATTER_DELIMITER,
    FRONTMATTER_DELIMITER.length,
  );
  if (endIndex === -1) {
    throw new Error('Invalid skill markdown: unclosed frontmatter');
  }

  const frontmatterBlock = trimmed
    .slice(FRONTMATTER_DELIMITER.length, endIndex)
    .trim();
  const body = trimmed.slice(endIndex + FRONTMATTER_DELIMITER.length).trim();

  if (!body) {
    throw new Error('Invalid skill markdown: empty prompt body');
  }

  const frontmatter = parseFrontmatter(frontmatterBlock);

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    prompt: body,
  };
}

function parseYamlValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return trimmed;
}

function parseFrontmatter(block: string): SkillFrontmatter {
  const fields: Record<string, string> = {};

  for (const line of block.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = parseYamlValue(line.slice(colonIndex + 1));
    fields[key] = value;
  }

  if (!fields.name) {
    throw new Error('Invalid skill markdown: missing "name" in frontmatter');
  }

  return {
    name: fields.name,
    description: fields.description ?? '',
  };
}

function yamlValue(value: string): string {
  if (/[\n\r]/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
  }
  return value;
}

export function serializeSkillMarkdown(
  name: string,
  description: string,
  prompt: string,
): string {
  const lines = [
    FRONTMATTER_DELIMITER,
    `name: ${yamlValue(name)}`,
    `description: ${yamlValue(description)}`,
    FRONTMATTER_DELIMITER,
    '',
    prompt,
  ];
  return lines.join('\n');
}
