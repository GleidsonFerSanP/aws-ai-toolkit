#!/usr/bin/env node

/**
 * Test MCP Server - Verifica quais tools estão sendo expostas
 *
 * Uso: node test-mcp-server.js
 */

const { createMCPServer } = require("./dist/index.js");

async function testMCPServer() {
  console.log("🧪 Testando MCP Server...\n");

  try {
    const server = createMCPServer();

    // Simular request de ListTools
    const mockRequest = {
      method: "tools/list",
      params: {},
    };

    // Acessar o handler interno
    const handlers = server._requestHandlers || server.requestHandlers;

    if (handlers && handlers.has("tools/list")) {
      const handler = handlers.get("tools/list");
      const result = await handler(mockRequest);

      console.log(`✅ Número de tools: ${result.tools.length}\n`);
      console.log("📋 Tools disponíveis:");
      result.tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name}`);
      });

      console.log("\n✅ Build está correto!");
      console.log(
        `\n⚠️  Se o GitHub Copilot está vendo ${result.tools.length} tools diferentes,`,
      );
      console.log("   o problema é com a extensão instalada no VS Code.\n");

      if (result.tools.length !== 12) {
        console.error(
          "❌ ERRO: Esperado 12 tools, encontrado",
          result.tools.length,
        );
        process.exit(1);
      }
    } else {
      console.error("❌ Handler não encontrado");
      console.log("Handlers disponíveis:", Array.from(handlers?.keys() || []));
    }
  } catch (error) {
    console.error("❌ Erro ao testar servidor:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testMCPServer();
