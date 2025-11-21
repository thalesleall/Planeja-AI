// Tipos para autenticação
export interface User {
  id: number;
  email: string;
  password?: string;
  name: string;
}

// Estender Request do Express com user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, "password">;
  token?: string;
}

// Tipos para planos
export interface Plan {
  id: number;
  name: string;
  owner_id: number;
}

export interface CreatePlanRequest {
  name: string;
}

export interface PlanResponse {
  success: boolean;
  message: string;
  plan?: Plan;
}

export interface PlansResponse {
  success: boolean;
  message: string;
  plans: Plan[];
  total: number;
}

// Tipos para listas
export interface TodoList {
  id: number;
  owner_id: number;
}

export interface CreateListRequest {
  name?: string;
  description?: string;
}

export interface ListResponse {
  success: boolean;
  message: string;
  list?: TodoList;
}

export interface ListsResponse {
  success: boolean;
  message: string;
  lists: TodoList[];
  total: number;
}

// Tipos para itens (tarefas)
export interface TodoItem {
  id: number;
  list_id: number;
  item_order: number;
  name: string;
  description?: string;
  done: boolean;
  priority?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  priority?: string;
  due_date?: string;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  done?: boolean;
  priority?: string;
  due_date?: string;
}

export interface ItemResponse {
  success: boolean;
  message: string;
  item?: TodoItem;
}

export interface ItemsResponse {
  success: boolean;
  message: string;
  items: TodoItem[];
  total: number;
  summary?: {
    pending: number;
    completed: number;
  };
}

// Tipos para steps (relação plano-lista)
export interface Step {
  id: number;
  plan_id: number;
  step_order: number;
  list_id: number;
}

export interface CreateStepRequest {
  plan_id: number;
  list_id: number;
  step_order?: number;
}

export interface StepResponse {
  success: boolean;
  message: string;
  step?: Step;
}

export interface StepsResponse {
  success: boolean;
  message: string;
  steps: Step[];
  total: number;
}

// Tipos para filtros
export interface ItemFilters {
  done?: boolean;
  limit?: number;
  offset?: number;
}

// Tipos para dados combinados
export interface PlanWithSteps extends Plan {
  steps: (Step & { list: TodoList })[];
}

export interface ListWithItems extends TodoList {
  items: TodoItem[];
}

export interface PlanDetails extends Plan {
  steps: (Step & {
    list: TodoList & {
      items: TodoItem[];
    };
  })[];
}
