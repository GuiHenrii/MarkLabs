import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

const postSchema = z.object({
  teamId: z.string().min(1, "teamId é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório").max(280, "Conteúdo muito longo"),
});

describe("Validação de Post com Zod", () => {
  it("deve validar um post correto", () => {
    const result = postSchema.safeParse({
      teamId: "team-123",
      content: "Olá mundo do MarkLabs!",
    });
    expect(result.success).toBe(true);
  });

  it("deve falhar se teamId estiver vazio", () => {
    const result = postSchema.safeParse({
      teamId: "",
      content: "Olá!",
    });
    expect(result.success).toBe(false);
  });
});
