'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck as CheckCircle2, Clock } from 'lucide-react';

interface AnalyticsCardsProps {
  completedTasks: number;
  pendingTasks: number;
}

export function AnalyticsCards({
  completedTasks,
  pendingTasks,
}: AnalyticsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingTasks}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando conclusão
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}</div>
          <p className="text-xs text-muted-foreground">
            Tarefas finalizadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
