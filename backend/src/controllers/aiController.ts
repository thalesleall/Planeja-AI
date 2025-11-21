import { Request, Response } from "express";
import TaskTitleAdapter from "../lib/taskTitleAdapter";

const suggestTasksFromTitle = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { title, context, limit } = req.body ?? {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "O título da tarefa é obrigatório",
      });
    }

    const result = await TaskTitleAdapter.generateFromTitle({
      title,
      context: typeof context === "string" ? context : undefined,
      limit: typeof limit === "number" ? limit : undefined,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Erro ao sugerir subtarefas via IA", error);
    return res.status(500).json({
      success: false,
      message: "Não foi possível gerar subtarefas no momento",
    });
  }
};

export default {
  suggestTasksFromTitle,
};
