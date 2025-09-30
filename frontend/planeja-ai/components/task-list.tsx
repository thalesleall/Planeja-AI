'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskListProps {
  tasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

export function TaskList({ tasks, onToggleComplete }: TaskListProps) {
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

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className={task.completed ? 'opacity-60' : ''}>
          <CardContent className="flex items-center p-4">
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) =>
                onToggleComplete(task.id, checked as boolean)
              }
              className="mr-4"
            />
            <p
              className={`font-medium flex-1 ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {task.title}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
