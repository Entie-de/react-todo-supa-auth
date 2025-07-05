
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Trash2, LogOut, Plus } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function Todos() {
  const { user, signOut } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch todos",
          variant: "destructive",
        });
        console.error('Error fetching todos:', error);
      } else {
        setTodos(data || []);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodo.trim()) {
      toast({
        title: "Error",
        description: "Please enter a todo title",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodo.trim(),
            user_id: user?.id,
            completed: false,
          },
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add todo",
          variant: "destructive",
        });
        console.error('Error adding todo:', error);
      } else {
        setTodos([data, ...todos]);
        setNewTodo('');
        toast({
          title: "Success",
          description: "Todo added successfully!",
        });
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setAdding(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update todo",
          variant: "destructive",
        });
        console.error('Error updating todo:', error);
      } else {
        setTodos(todos.map(todo => 
          todo.id === id ? { ...todo, completed: !completed } : todo
        ));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete todo",
          variant: "destructive",
        });
        console.error('Error deleting todo:', error);
      } else {
        setTodos(todos.filter(todo => todo.id !== id));
        toast({
          title: "Success",
          description: "Todo deleted successfully!",
        });
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your todos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Todos</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Add Todo Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTodo} className="flex gap-4">
              <Input
                type="text"
                placeholder="What needs to be done?"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={adding}>
                {adding ? 'Adding...' : 'Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todos List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 text-lg">No todos yet. Add your first todo above!</p>
              </CardContent>
            </Card>
          ) : (
            todos.map((todo) => (
              <Card key={todo.id} className={`transition-opacity ${todo.completed ? 'opacity-60' : ''}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                      />
                      <div className="flex-1">
                        <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Created {new Date(todo.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteTodo(todo.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        {todos.length > 0 && (
          <Card className="mt-8">
            <CardContent className="py-4">
              <div className="flex justify-center space-x-8 text-sm text-gray-600">
                <span>Total: {todos.length}</span>
                <span>Completed: {todos.filter(t => t.completed).length}</span>
                <span>Remaining: {todos.filter(t => !t.completed).length}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
