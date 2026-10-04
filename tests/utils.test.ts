import { describe, it, expect } from "vitest";
import {
  formatBRL,
  round2,
  parseDecimal,
  percentage,
  maskPhone,
  normalizeName,
  getErrorMessage,
} from "../src/lib/utils";

describe("formatBRL", () => {
  it("formata valores como moeda brasileira", () => {
    expect(formatBRL(1500)).toBe("R$\u00a01.500,00");
  });

  it("protege contra NaN/Infinity", () => {
    expect(formatBRL(Number.NaN)).toBe("R$\u00a00,00");
  });
});

describe("round2", () => {
  it("arredonda para 2 casas decimais", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(10.005)).toBe(10.01);
  });
});

describe("parseDecimal", () => {
  it("aceita vírgula decimal", () => {
    expect(parseDecimal("150,50")).toBe(150.5);
  });

  it("remove separador de milhar com vírgula decimal", () => {
    expect(parseDecimal("1.500,00")).toBe(1500);
  });

  it("retorna 0 para entradas inválidas ou negativas", () => {
    expect(parseDecimal("abc")).toBe(0);
    expect(parseDecimal("-10")).toBe(0);
    expect(parseDecimal("")).toBe(0);
  });
});

describe("percentage", () => {
  it("calcula percentual inteiro", () => {
    expect(percentage(3, 10)).toBe(30);
  });

  it("retorna 0 quando o total é zero (sem divisão por zero)", () => {
    expect(percentage(3, 0)).toBe(0);
  });
});

describe("maskPhone", () => {
  it("aplica máscara de celular (11 dígitos)", () => {
    expect(maskPhone("87999998888")).toBe("(87) 99999-8888");
  });

  it("aplica máscara de fixo (10 dígitos)", () => {
    expect(maskPhone("8738211234")).toBe("(87) 3821-1234");
  });

  it("limita a 11 dígitos", () => {
    expect(maskPhone("123456789012345")).toBe("(12) 34567-8901");
  });
});

describe("normalizeName", () => {
  it("remove espaços duplicados e nas extremidades", () => {
    expect(normalizeName("  João   da  Silva ")).toBe("João da Silva");
  });
});

describe("getErrorMessage", () => {
  it("extrai mensagem de Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("extrai mensagem de objetos estilo PostgREST", () => {
    expect(getErrorMessage({ message: "constraint violated" })).toBe(
      "constraint violated"
    );
  });

  it("usa fallback para valores desconhecidos", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });
});
