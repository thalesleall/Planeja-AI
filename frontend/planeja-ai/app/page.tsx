'use client';

import { useEffect, useState } from 'react';
import { AnalyticsCards } from '@/components/analytics-cards';
import { supabase } from '@/lib/supabase';
import { TaskList } from '@/components/task-list';
import { AddTaskForm } from '@/components/add-task-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListTodo } from 'lucide-react';
import { Task } from '@/lib/supabase';

export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    const addTask = async (title: string) => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    {
                        title,
                        user_id: '00000000-0000-0000-0000-000000000000',
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setTasks([data, ...tasks]);
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleAISuggest = async () => {
        try {
            const response = await fetch('/api/suggest-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to get suggestion');

            const { suggestion } = await response.json();
            await addTask(suggestion);
        } catch (error) {
            console.error('Error getting AI suggestion:', error);
        }
    };

    const toggleComplete = async (taskId: string, completed: boolean) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ completed, updated_at: new Date().toISOString() })
                .eq('id', taskId);

            if (error) throw error;
            setTasks(
                tasks.map((task) =>
                    task.id === taskId ? { ...task, completed } : task
                )
            );
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const completedTasks = tasks.filter((task) => task.completed).length;
    const pendingTasks = tasks.filter((task) => !task.completed).length;

    const filteredTasks = tasks.filter((task) => {
        if (filter === 'pending') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

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
