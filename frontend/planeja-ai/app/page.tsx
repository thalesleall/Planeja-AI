'use client';

import { useEffect, useState } from 'react';
import { AnalyticsCards } from '@/components/analytics-cards';
import { TaskList } from '@/components/task-list';
import { AddTaskForm } from '@/components/add-task-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListTodo } from 'lucide-react';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3">
          <ListTodo className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">Minhas Tarefas</h1>
        </div>

        <AnalyticsCards
          completedTasks={completedTasks}
          pendingTasks={pendingTasks}
        />

        <AddTaskForm onAddTask={addTask} onAISuggest={handleAISuggest} />

        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Completas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={toggleComplete}
            />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={toggleComplete}
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={toggleComplete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
