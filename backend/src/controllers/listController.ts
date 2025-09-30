import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import '../types/express';

export class ListController {
  // GET /lists
  static async getAllLists(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          lists: [],
          total: 0
        });
      }

      const { data: lists, error, count } = await supabase
        .from('to_do_list')
        .select('*', { count: 'exact' })
        .eq('owner_id', parseInt(req.user.id))
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar listas:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar listas',
          lists: [],
          total: 0
        });
      }

      res.json({
        success: true,
        message: `${lists?.length || 0} lista(s) encontrada(s)`,
        lists: lists || [],
        total: count || 0
      });

    } catch (error) {
      console.error('Erro ao obter listas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        lists: [],
        total: 0
      });
    }
  }

  // POST /lists
  static async createList(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { data: newList, error } = await supabase
        .from('to_do_list')
        .insert([
          {
            owner_id: parseInt(req.user.id)
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar lista:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao criar lista'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Lista criada com sucesso',
        list: newList
      });

    } catch (error) {
      console.error('Erro ao criar lista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /lists/:id
  static async getListById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { id } = req.params;

      // Buscar lista com seus itens
      const { data: list, error: listError } = await supabase
        .from('to_do_list')
        .select(`
          *,
          to_do_item (*)
        `)
        .eq('id', parseInt(id))
        .eq('owner_id', parseInt(req.user.id))
        .single();

      if (listError || !list) {
        return res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Lista obtida com sucesso',
        list
      });

    } catch (error) {
      console.error('Erro ao obter lista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // DELETE /lists/:id
  static async deleteList(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { id } = req.params;

      const { error } = await supabase
        .from('to_do_list')
        .delete()
        .eq('id', parseInt(id))
        .eq('owner_id', parseInt(req.user.id));

      if (error) {
        console.error('Erro ao deletar lista:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao deletar lista'
        });
      }

      res.json({
        success: true,
        message: 'Lista deletada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar lista:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // POST /lists/:listId/items
  static async createItemInList(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { listId } = req.params;
      const { name, description } = req.body;

      // Verificar se a lista pertence ao usuário
      const { data: list, error: listError } = await supabase
        .from('to_do_list')
        .select('id')
        .eq('id', parseInt(listId))
        .eq('owner_id', parseInt(req.user.id))
        .single();

      if (listError || !list) {
        return res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
      }

      // Obter próximo item_order
      const { data: lastItem } = await supabase
        .from('to_do_item')
        .select('item_order')
        .eq('list_id', parseInt(listId))
        .order('item_order', { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (lastItem?.item_order || 0) + 1;

      const { data: newItem, error } = await supabase
        .from('to_do_item')
        .insert([
          {
            list_id: parseInt(listId),
            name,
            description,
            item_order: nextOrder,
            done: false
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao criar tarefa'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Tarefa criada com sucesso',
        item: newItem
      });

    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}