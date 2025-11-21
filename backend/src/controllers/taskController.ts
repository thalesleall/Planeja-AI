import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import {
  CreateItemRequest,
  UpdateItemRequest,
  ItemsResponse,
  ItemResponse,
} from "../types";

export class TaskController {
  // GET /tasks?done=true|false&list_id=123
  static async getTasks(req: Request, res: Response<ItemsResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
          items: [],
          total: 0,
        });
      }

      const { done, priority, list_id, limit = "50", offset = "0" } = req.query;

      // Construir query - buscar através das listas do usuário
      let query = supabase
        .from("to_do_item")
        .select(
          `
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `,
          { count: "exact" }
        )
        .eq("to_do_list.owner_id", parseInt(req.user.id))
        .order("id", { ascending: false });

      // Aplicar filtros
      if (done !== undefined) {
        query = query.eq("done", done === "true");
      }

      if (list_id) {
        query = query.eq("list_id", parseInt(list_id as string));
      }

      if (priority && ["low", "medium", "high"].includes(priority as string)) {
        query = query.eq("priority", priority);
      }

      // Aplicar paginação
      const limitNum = parseInt(limit as string) || 50;
      const offsetNum = parseInt(offset as string) || 0;

      query = query.range(offsetNum, offsetNum + limitNum - 1);

      const { data: items, error, count } = await query;

      if (error) {
        console.error("Erro ao buscar tarefas:", error);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao buscar tarefas",
          items: [],
          total: 0,
        });
      }

      const summary = await TaskController.buildSummary(parseInt(req.user.id));

      res.json({
        success: true,
        message: `${items?.length || 0} tarefa(s) encontrada(s)`,
        items: items || [],
        total: count || 0,
        summary,
      });
    } catch (error) {
      console.error("Erro ao obter tarefas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        items: [],
        total: 0,
      });
    }
  }

  // GET /tasks/pending
  static async getPendingTasks(req: Request, res: Response<ItemsResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
          items: [],
          total: 0,
        });
      }

      const {
        data: items,
        error,
        count,
      } = await supabase
        .from("to_do_item")
        .select(
          `
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `,
          { count: "exact" }
        )
        .eq("to_do_list.owner_id", parseInt(req.user.id))
        .eq("done", false)
        .order("id", { ascending: false });

      if (error) {
        console.error("Erro ao buscar tarefas pendentes:", error);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao buscar tarefas pendentes",
          items: [],
          total: 0,
        });
      }

      const summary = await TaskController.buildSummary(parseInt(req.user.id));

      res.json({
        success: true,
        message: `${items?.length || 0} tarefa(s) pendente(s) encontrada(s)`,
        items: items || [],
        total: count || 0,
        summary,
      });
    } catch (error) {
      console.error("Erro ao obter tarefas pendentes:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        items: [],
        total: 0,
      });
    }
  }

  // GET /tasks/completed
  static async getCompletedTasks(req: Request, res: Response<ItemsResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
          items: [],
          total: 0,
        });
      }

      const {
        data: items,
        error,
        count,
      } = await supabase
        .from("to_do_item")
        .select(
          `
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `,
          { count: "exact" }
        )
        .eq("to_do_list.owner_id", parseInt(req.user.id))
        .eq("done", true)
        .order("id", { ascending: false });

      if (error) {
        console.error("Erro ao buscar tarefas concluídas:", error);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao buscar tarefas concluídas",
          items: [],
          total: 0,
        });
      }

      const summary = await TaskController.buildSummary(parseInt(req.user.id));

      res.json({
        success: true,
        message: `${items?.length || 0} tarefa(s) concluída(s) encontrada(s)`,
        items: items || [],
        total: count || 0,
        summary,
      });
    } catch (error) {
      console.error("Erro ao obter tarefas concluídas:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        items: [],
        total: 0,
      });
    }
  }

  // POST /lists/:listId/items - Criar nova tarefa em uma lista
  static async createTask(
    req: Request<{ listId: string }, ItemResponse, CreateItemRequest>,
    res: Response<ItemResponse>
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const { listId } = req.params;
      const { name, description, priority, due_date } = req.body;

      // Verificar se a lista pertence ao usuário
      const { data: list, error: listError } = await supabase
        .from("to_do_list")
        .select("id")
        .eq("id", parseInt(listId))
        .eq("owner_id", parseInt(req.user.id))
        .single();

      if (listError || !list) {
        return res.status(404).json({
          success: false,
          message: "Lista não encontrada",
        });
      }

      // Obter próximo item_order
      const { data: lastItem } = await supabase
        .from("to_do_item")
        .select("item_order")
        .eq("list_id", parseInt(listId))
        .order("item_order", { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (lastItem?.item_order || 0) + 1;

      const { data: newItem, error } = await supabase
        .from("to_do_item")
        .insert([
          {
            list_id: parseInt(listId),
            name,
            description,
            item_order: nextOrder,
            done: false,
            priority: priority || null,
            due_date: due_date || null,
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao criar tarefa",
        });
      }

      res.status(201).json({
        success: true,
        message: "Tarefa criada com sucesso",
        item: newItem,
      });
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // PUT /tasks/:id/complete
  static async completeTask(
    req: Request<{ id: string }, ItemResponse, { done?: boolean }>,
    res: Response<ItemResponse>
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const { id } = req.params;
      const desiredState =
        typeof req.body?.done === "boolean" ? req.body.done : true;

      const { data: updatedItem, error } = await supabase
        .from("to_do_item")
        .update({
          done: desiredState,
        })
        .eq("id", parseInt(id))
        .eq("to_do_list.owner_id", parseInt(req.user.id))
        .select(
          `
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `
        )
        .single();

      if (error) {
        console.error("Erro ao completar tarefa:", error);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao completar tarefa",
        });
      }

      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          message: "Tarefa não encontrada",
        });
      }

      res.json({
        success: true,
        message: desiredState
          ? "Tarefa marcada como concluída"
          : "Tarefa marcada como pendente",
        item: updatedItem,
      });
    } catch (error) {
      console.error("Erro ao completar tarefa:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  // DELETE /tasks/:id
  static async deleteTask(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const { id } = req.params;

      const { error } = await supabase
        .from("to_do_item")
        .delete()
        .eq("id", parseInt(id))
        .eq("to_do_list.owner_id", parseInt(req.user.id));

      if (error) {
        console.error("Erro ao deletar tarefa:", error);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao deletar tarefa",
        });
      }

      res.json({
        success: true,
        message: "Tarefa deletada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  static async updateTask(
    req: Request<{ id: string }, ItemResponse, UpdateItemRequest>,
    res: Response<ItemResponse>
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
      }

      const { id } = req.params;
      const { name, description, done, priority, due_date } = req.body;

      const updateData: Record<string, unknown> = {};
      if (typeof name === "string") updateData.name = name;
      if (typeof description !== "undefined")
        updateData.description = description;
      if (typeof done === "boolean") updateData.done = done;
      if (typeof priority === "string") updateData.priority = priority;
      if (typeof due_date === "string") updateData.due_date = due_date;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nenhum campo informado para atualização",
        });
      }

      const { data: updatedItem, error } = await supabase
        .from("to_do_item")
        .update(updateData)
        .eq("id", parseInt(id))
        .eq("to_do_list.owner_id", parseInt(req.user.id))
        .select(
          `
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `
        )
        .single();

      if (error || !updatedItem) {
        console.error("Erro ao atualizar tarefa:", error);
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor ao atualizar tarefa",
        });
      }

      res.json({
        success: true,
        message: "Tarefa atualizada com sucesso",
        item: updatedItem,
      });
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  private static async buildSummary(userId: number) {
    try {
      const [pending, completed] = await Promise.all([
        supabase
          .from("to_do_item")
          .select(`id, to_do_list!inner ( owner_id )`, {
            count: "exact",
            head: true,
          })
          .eq("to_do_list.owner_id", userId)
          .eq("done", false),
        supabase
          .from("to_do_item")
          .select(`id, to_do_list!inner ( owner_id )`, {
            count: "exact",
            head: true,
          })
          .eq("to_do_list.owner_id", userId)
          .eq("done", true),
      ]);

      return {
        pending: pending.count || 0,
        completed: completed.count || 0,
      };
    } catch (error) {
      console.error("Erro ao calcular resumo de tarefas:", error);
      return {
        pending: 0,
        completed: 0,
      };
    }
  }
}
