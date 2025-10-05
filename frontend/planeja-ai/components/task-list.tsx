'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface ToDoItemProps {
  tasks: {
    id: number;
    list_id: number;
    item_order: number;
    name: string;
    description: string | null;
    done: boolean;
  }[];
  onToggleComplete: (taskId: number, completed: boolean) => void;
  onUpdateTask?: (taskId: number, fields: { name?: string; description?: string | null }) => void;
}

export function TaskList({ tasks, onToggleComplete, onUpdateTask }: ToDoItemProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            Nenhuma tarefa encontrada. Adicione uma nova tarefa para começar!
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = (task: typeof tasks[0]) => {
    setEditingId(task.id);
    setEditName(task.name);
    setEditDescription(task.description || '');
  };

  const handleSave = (taskId: number) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { name: editName, description: editDescription });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className={task.done ? 'opacity-60' : ''}>
          <CardContent className="flex flex-col p-4">
            <div className="flex items-start w-full gap-3">
              <Checkbox
                checked={task.done}
                onCheckedChange={(checked) =>
                  onToggleComplete(task.id, checked as boolean)
                }
                className="mt-1"
              />

              <div className="flex-1 flex flex-col">
                {editingId === task.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input input-sm w-full font-medium mb-1"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="input input-sm w-full h-16 resize-none text-gray-700 text-sm"
                      placeholder="Descrição (opcional)"
                    />
                  </>
                ) : (
                  <>
                    <p
                      className={`font-medium text-gray-900 ${
                        task.done ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.name}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                        {task.description}
                      </p>
                    )}
                  </>
                )}
              </div>

              {editingId === task.id ? (
                <button
                  onClick={() => handleSave(task.id)}
                  className="ml-2 btn btn-sm btn-primary"
                >
                  Salvar
                </button>
              ) : (
                <button
                  onClick={() => handleEdit(task)}
                  className="ml-2 btn btn-sm btn-secondary"
                >
                  Editar
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
