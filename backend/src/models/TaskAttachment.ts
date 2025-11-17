import { ObjectId, Collection } from 'mongodb';
import { getDB } from '../config/mongodb';

export interface ITaskAttachment {
  _id?: ObjectId;
  task_id: number;
  user_id: number;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnail_url?: string;
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    is_cover: boolean;
  };
  uploaded_at: Date;
  tags?: string[];
}

export class TaskAttachmentModel {
  private collection: Collection<ITaskAttachment>;

  constructor() {
    this.collection = getDB().collection<ITaskAttachment>('task_attachments');
  }

  /**
   * Criar novo anexo
   */
  async create(attachment: Omit<ITaskAttachment, '_id'>): Promise<ObjectId> {
    const result = await this.collection.insertOne({
      ...attachment,
      uploaded_at: new Date()
    });
    return result.insertedId;
  }

  /**
   * Buscar anexos de uma task específica
   */
  async findByTaskId(taskId: number): Promise<ITaskAttachment[]> {
    return this.collection
      .find({ task_id: taskId })
      .sort({ uploaded_at: -1 })
      .toArray();
  }

  /**
   * Buscar um anexo por ID
   */
  async findById(id: string): Promise<ITaskAttachment | null> {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Deletar um anexo específico
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  /**
   * Deletar todos anexos de uma task
   */
  async deleteByTaskId(taskId: number): Promise<number> {
    const result = await this.collection.deleteMany({ task_id: taskId });
    return result.deletedCount;
  }

  /**
   * Definir um anexo como capa da task
   */
  async setAsCover(id: string, taskId: number): Promise<void> {
    // Remover capa atual
    await this.collection.updateMany(
      { task_id: taskId },
      { $set: { 'metadata.is_cover': false } }
    );
    
    // Definir nova capa
    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { 'metadata.is_cover': true } }
    );
  }

  /**
   * Contar anexos de uma task
   */
  async countByTaskId(taskId: number): Promise<number> {
    return this.collection.countDocuments({ task_id: taskId });
  }

  /**
   * Buscar capa de uma task
   */
  async findCoverByTaskId(taskId: number): Promise<ITaskAttachment | null> {
    return this.collection.findOne({ 
      task_id: taskId, 
      'metadata.is_cover': true 
    });
  }

  /**
   * Buscar anexos de múltiplas tasks (para listar tasks com anexos)
   */
  async findByTaskIds(taskIds: number[]): Promise<Map<number, ITaskAttachment[]>> {
    const attachments = await this.collection
      .find({ task_id: { $in: taskIds } })
      .sort({ uploaded_at: -1 })
      .toArray();

    const attachmentMap = new Map<number, ITaskAttachment[]>();
    
    for (const attachment of attachments) {
      if (!attachmentMap.has(attachment.task_id)) {
        attachmentMap.set(attachment.task_id, []);
      }
      attachmentMap.get(attachment.task_id)!.push(attachment);
    }

    return attachmentMap;
  }
}
