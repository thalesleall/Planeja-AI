import { Request, Response } from "express";
import { TaskAttachmentModel } from "../models/TaskAttachment";
import {
  generateThumbnail,
  getImageMetadata,
  isImage,
} from "../utils/imageProcessor";
import { supabase } from "../config/supabase";
import { isMongoDBConnected } from "../config/mongodb";
import path from "path";
import fs from "fs";

let attachmentModel: TaskAttachmentModel | null = null;

// Inicializar model (será chamado após MongoDB conectar)
export const initAttachmentModel = () => {
  if (isMongoDBConnected()) {
    attachmentModel = new TaskAttachmentModel();
  }
};

export class AttachmentController {
  /**
   * POST /api/v1/tasks/:taskId/attachments
   * Upload de arquivos (até 10 por vez)
   */
  static async upload(req: Request, res: Response) {
    try {
      if (!attachmentModel) {
        return res.status(503).json({
          success: false,
          message:
            "MongoDB não disponível. Anexos temporariamente indisponíveis.",
        });
      }

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Não autenticado" });
      }

      const taskId = parseInt(req.params.taskId);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Nenhum arquivo enviado" });
      }

      // Verificar se a task existe e pertence ao usuário
      const { data: task, error } = await supabase
        .from("to_do_item")
        .select(
          `
          id,
          to_do_list!inner (
            owner_id
          )
        `
        )
        .eq("id", taskId)
        .single();

      if (
        error ||
        !task ||
        (task.to_do_list as any).owner_id !== parseInt(req.user.id)
      ) {
        // Limpar arquivos já enviados
        files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({
            success: false,
            message: "Task não encontrada ou sem permissão",
          });
      }

      // Processar cada arquivo
      const attachments = [];

      for (const file of files) {
        let thumbnailUrl = undefined;
        let metadata: any = { is_cover: false };

        // Se for imagem, gerar thumbnail e metadados
        if (isImage(file.mimetype)) {
          try {
            await generateThumbnail(file.path, taskId.toString());
            thumbnailUrl = `/api/v1/attachments/${taskId}/thumb/${file.filename}`;

            const imgMeta = await getImageMetadata(file.path);
            metadata = {
              width: imgMeta.width,
              height: imgMeta.height,
              format: imgMeta.format,
              is_cover: false,
            };
          } catch (err) {
            console.error("Erro ao processar imagem:", err);
            // Continua sem thumbnail
          }
        }

        // Salvar no MongoDB
        const attachmentId = await attachmentModel.create({
          task_id: taskId,
          user_id: parseInt(req.user.id),
          filename: file.filename,
          original_name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/api/v1/attachments/${taskId}/${file.filename}`,
          thumbnail_url: thumbnailUrl,
          metadata,
          uploaded_at: new Date(),
        });

        attachments.push({
          id: attachmentId.toString(),
          filename: file.originalname,
          url: `/api/v1/attachments/${taskId}/${file.filename}`,
          thumbnail_url: thumbnailUrl,
          size: file.size,
          mimetype: file.mimetype,
          uploaded_at: new Date(),
        });
      }

      res.status(201).json({
        success: true,
        message: `${attachments.length} arquivo(s) enviado(s) com sucesso`,
        attachments,
      });
    } catch (error: any) {
      console.error("Erro no upload:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao fazer upload dos arquivos",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/tasks/:taskId/attachments
   * Listar todos os anexos de uma task
   */
  static async list(req: Request, res: Response) {
    try {
      if (!attachmentModel) {
        return res.json({ success: true, count: 0, attachments: [] });
      }

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Não autenticado" });
      }

      const taskId = parseInt(req.params.taskId);

      // Verificar permissão
      const { data: task } = await supabase
        .from("to_do_item")
        .select(
          `
          id,
          to_do_list!inner (
            owner_id
          )
        `
        )
        .eq("id", taskId)
        .single();

      if (
        !task ||
        (task.to_do_list as any).owner_id !== parseInt(req.user.id)
      ) {
        return res
          .status(404)
          .json({ success: false, message: "Task não encontrada" });
      }

      // Buscar anexos no MongoDB
      const attachments = await attachmentModel.findByTaskId(taskId);

      res.json({
        success: true,
        count: attachments.length,
        attachments: attachments.map((att) => ({
          id: att._id?.toString(),
          filename: att.original_name,
          url: att.url,
          thumbnail_url: att.thumbnail_url,
          size: att.size,
          mimetype: att.mimetype,
          is_cover: att.metadata.is_cover,
          uploaded_at: att.uploaded_at,
        })),
      });
    } catch (error: any) {
      console.error("Erro ao listar anexos:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /api/v1/tasks/:taskId/attachments/:attachmentId
   * Deletar um anexo específico
   */
  static async delete(req: Request, res: Response) {
    try {
      if (!attachmentModel) {
        return res
          .status(503)
          .json({ success: false, message: "MongoDB não disponível" });
      }

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Não autenticado" });
      }

      const taskId = parseInt(req.params.taskId);
      const attachmentId = req.params.attachmentId;

      // Buscar anexo
      const attachment = await attachmentModel.findById(attachmentId);

      if (!attachment || attachment.task_id !== taskId) {
        return res
          .status(404)
          .json({ success: false, message: "Anexo não encontrado" });
      }

      // Verificar permissão (se o usuário é dono da task)
      const { data: task } = await supabase
        .from("to_do_item")
        .select(
          `
          id,
          to_do_list!inner (
            owner_id
          )
        `
        )
        .eq("id", taskId)
        .single();

      if (
        !task ||
        (task.to_do_list as any).owner_id !== parseInt(req.user.id)
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Sem permissão para deletar este anexo",
          });
      }

      // Deletar arquivos físicos
      const originalPath = path.join(
        __dirname,
        "../../uploads/tasks",
        taskId.toString(),
        "original",
        attachment.filename
      );
      const thumbPath = path.join(
        __dirname,
        "../../uploads/tasks",
        taskId.toString(),
        "thumbnails",
        attachment.filename
      );

      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }

      // Deletar do MongoDB
      await attachmentModel.delete(attachmentId);

      res.json({ success: true, message: "Anexo deletado com sucesso" });
    } catch (error: any) {
      console.error("Erro ao deletar anexo:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PUT /api/v1/tasks/:taskId/attachments/:attachmentId/set-cover
   * Definir um anexo como capa da task
   */
  static async setCover(req: Request, res: Response) {
    try {
      if (!attachmentModel) {
        return res
          .status(503)
          .json({ success: false, message: "MongoDB não disponível" });
      }

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Não autenticado" });
      }

      const taskId = parseInt(req.params.taskId);
      const attachmentId = req.params.attachmentId;

      // Verificar se anexo existe e pertence à task
      const attachment = await attachmentModel.findById(attachmentId);

      if (!attachment || attachment.task_id !== taskId) {
        return res
          .status(404)
          .json({ success: false, message: "Anexo não encontrado" });
      }

      // Verificar permissão
      const { data: task } = await supabase
        .from("to_do_item")
        .select(
          `
          id,
          to_do_list!inner (
            owner_id
          )
        `
        )
        .eq("id", taskId)
        .single();

      if (
        !task ||
        (task.to_do_list as any).owner_id !== parseInt(req.user.id)
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Sem permissão" });
      }

      // Definir como capa
      await attachmentModel.setAsCover(attachmentId, taskId);

      res.json({ success: true, message: "Capa definida com sucesso" });
    } catch (error: any) {
      console.error("Erro ao definir capa:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/v1/attachments/:taskId/:filename
   * Servir arquivo original
   */
  static async serve(req: Request, res: Response) {
    try {
      const { taskId, filename } = req.params;
      const filePath = path.join(
        __dirname,
        "../../uploads/tasks",
        taskId,
        "original",
        filename
      );

      if (!fs.existsSync(filePath)) {
        return res
          .status(404)
          .json({ success: false, message: "Arquivo não encontrado" });
      }

      res.sendFile(filePath);
    } catch (error: any) {
      console.error("Erro ao servir arquivo:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/v1/attachments/:taskId/thumb/:filename
   * Servir thumbnail
   */
  static async serveThumbnail(req: Request, res: Response) {
    try {
      const { taskId, filename } = req.params;
      const thumbPath = path.join(
        __dirname,
        "../../uploads/tasks",
        taskId,
        "thumbnails",
        filename
      );

      if (!fs.existsSync(thumbPath)) {
        // Se não houver thumbnail, retornar original
        const originalPath = path.join(
          __dirname,
          "../../uploads/tasks",
          taskId,
          "original",
          filename
        );
        if (fs.existsSync(originalPath)) {
          return res.sendFile(originalPath);
        }
        return res
          .status(404)
          .json({ success: false, message: "Thumbnail não encontrado" });
      }

      res.sendFile(thumbPath);
    } catch (error: any) {
      console.error("Erro ao servir thumbnail:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
