'use client';

import { useEffect, useState } from 'react';
import { AnalyticsCards } from '@/components/analytics-cards';
import { supabase } from '@/lib/supabase';
import { TaskList } from '@/components/task-list';
import { AddTaskForm } from '@/components/add-task-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListTodo } from 'lucide-react';
import { ToDoItem } from '@/lib/supabase';
import { TaskState } from '@/@types/task';

export default function Home() {
    const [tasks, setTasks] = useState<ToDoItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    useEffect(() => {
        const fetchTasks = async () => {
            const { data, error } = await supabase
                .from('to_do_item')
                .select('*')
                .order('item_order', { ascending: true });

            if (error) {
                console.error('Erro ao buscar tarefas:', error);
            } else {
                setTasks(data);
            }
        };

        fetchTasks();
    }, []);

    // Adicionar tarefa com título e descrição
    const addTask = async (title: string, description: string | null = null) => {
        try {
            const { data, error } = await supabase
                .from('to_do_item')
                .insert([
                    {
                        name: title,
                        list_id: 1,
                        item_order: tasks.length + 1,
                        description,
                        done: false,
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            if (data) setTasks([data, ...tasks]);
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
        }
    };

    // Sugestão da AI
    const handleAISuggest = async () => {
        try {
            const response = await fetch('/api/suggest-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Falha ao obter sugestão');

            const { suggestion } = await response.json();
            await addTask(suggestion);
        } catch (error) {
            console.error('Erro ao obter sugestão AI:', error);
        }
    };

    // Marcar tarefa como completa
    const toggleComplete = async (id: number, completed: boolean) => {
        try {
            const { error } = await supabase
                .from('to_do_item')
                .update({ done: completed })
                .eq('id', id);

            if (error) throw error;

            setTasks(tasks.map((task) => (task.id === id ? { ...task, done: completed } : task)));
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
        }
    };

    // Atualizar nome ou descrição da tarefa
    const updateTask = async (id: number, fields: { name?: string; description?: string | null }) => {
        try {
            const { data, error } = await supabase
                .from('to_do_item')
                .update(fields)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setTasks(tasks.map((task) => (task.id === id ? data : task)));
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
        }
    };

    const completedTasks = tasks.filter((t) => t.done).length;
    const pendingTasks = tasks.filter((t) => !t.done).length;

    const filteredTasks = tasks.filter((t) => {
        if (filter === 'pending') return !t.done;
        if (filter === 'completed') return t.done;
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <div className="flex items-center gap-3">
                    <ListTodo className="h-8 w-8 text-blue-600" />
                    <h1 className="text-4xl font-bold text-slate-900">Minhas Tarefas</h1>
                </div>

                <AnalyticsCards completedTasks={completedTasks} pendingTasks={pendingTasks} />

                <AddTaskForm onAddTask={addTask} onAISuggest={handleAISuggest} />

                <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as TaskState)}>
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="pending">Pendentes</TabsTrigger>
                        <TabsTrigger value="completed">Completas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-6">
                        <TaskList
                            tasks={filteredTasks}
                            onToggleComplete={toggleComplete}
                            onUpdateTask={updateTask}
                        />
                    </TabsContent>

                    <TabsContent value="pending" className="mt-6">
                        <TaskList
                            tasks={filteredTasks}
                            onToggleComplete={toggleComplete}
                            onUpdateTask={updateTask}
                        />
                    </TabsContent>

                    <TabsContent value="completed" className="mt-6">
                        <TaskList
                            tasks={filteredTasks}
                            onToggleComplete={toggleComplete}
                            onUpdateTask={updateTask}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
