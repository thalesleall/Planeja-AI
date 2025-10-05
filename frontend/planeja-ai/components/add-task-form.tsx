'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Sparkles } from 'lucide-react';

interface AddTaskFormProps {
  onAddTask: (title: string) => void;
  onAISuggest: () => void;
}

export function AddTaskForm({ onAddTask, onAISuggest }: AddTaskFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask(title);
      setTitle('');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Adicionar nova tarefa..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          <Button type="button" variant="outline" onClick={onAISuggest}>
            <Sparkles className="h-4 w-4 mr-2" />
            Sugerir com IA
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
