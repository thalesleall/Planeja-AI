import { Request, Response, Router } from "express";
import { testSupabaseConnection, getProjectInfo, getDatabaseStructure, getDatabaseConstraints } from "../config/supabase";

const router = Router();

// Rota para testar conexão com Supabase
router.get("/supabase/test", async (req: Request, res: Response) => {
  try {
    const isConnected = await testSupabaseConnection();
    const projectInfo = await getProjectInfo();
    
    res.json({
      status: isConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      project: projectInfo,
      message: isConnected 
        ? "Conexão com Supabase estabelecida com sucesso" 
        : "Falha na conexão com Supabase"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Erro ao testar conexão com Supabase"
    });
  }
});

// Rota para informações do projeto Supabase
router.get("/supabase/info", async (req: Request, res: Response) => {
  try {
    const projectInfo = await getProjectInfo();
    
    res.json({
      timestamp: new Date().toISOString(),
      project: projectInfo
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Erro ao obter informações do projeto"
    });
  }
});

// Rota para obter estrutura das tabelas
router.get("/supabase/structure", async (req: Request, res: Response) => {
  try {
    const structure = await getDatabaseStructure();
    
    res.json({
      timestamp: new Date().toISOString(),
      database: structure,
      message: structure.error ? "Erro ao obter estrutura" : "Estrutura obtida com sucesso"
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Erro ao obter estrutura do banco de dados"
    });
  }
});

// Rota para obter constraints das tabelas
router.get("/supabase/constraints", async (req: Request, res: Response) => {
  try {
    const constraints = await getDatabaseConstraints();
    
    res.json({
      timestamp: new Date().toISOString(),
      database: constraints,
      message: constraints.error ? "Erro ao obter constraints" : "Constraints obtidas com sucesso"
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Erro ao obter constraints do banco de dados"
    });
  }
});

export default router;