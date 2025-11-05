import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do Supabase
const supabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://qxeqahkekcdtqwckzavv.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZXFhaGtla2NkdHF3Y2t6YXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODQ5NjgsImV4cCI6MjA3NTE2MDk2OH0.gQ843FHB800mFnAReCmakSPs-S4DSnaxUi4-IRz1UqA',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  dbPassword: process.env.SUPABASE_DB_PASSWORD || 'T0d0L!st#42]'
};

// Cliente Supabase principal (usando anon key)
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Cliente Supabase com service role (para operações admin)
const supabaseAdmin = supabaseConfig.serviceRoleKey 
  ? createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey)
  : null;

// Função para testar conexão
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Testa a conexão verificando se consegue acessar a API
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0);
    
    // Se não der erro de autenticação, a conexão está OK
    if (error && error.message.includes('JWT')) {
      console.error('Erro na conexão com Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('⚠️ Aviso Supabase:', error instanceof Error ? error.message : error);
    // Continua mesmo com erro - as tabelas podem não existir ainda
    return true;
  }
};

// Função para obter informações do projeto
export const getProjectInfo = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    return {
      url: supabaseConfig.url,
      connected: !error,
      hasServiceRole: !!supabaseAdmin,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      url: supabaseConfig.url,
      connected: false,
      hasServiceRole: !!supabaseAdmin,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Função para obter estrutura das tabelas
export const getDatabaseStructure = async () => {
  try {
    // Consulta para obter todas as tabelas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('Erro ao buscar tabelas:', tablesError);
      return { tables: [], error: tablesError.message };
    }

    // Para cada tabela, obter suas colunas
    const tablesWithColumns = [];
    
    for (const table of tables || []) {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position');

      if (!columnsError) {
        tablesWithColumns.push({
          table_name: table.table_name,
          columns: columns
        });
      }
    }

    return { 
      tables: tablesWithColumns, 
      error: null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao obter estrutura do banco:', error);
    return { 
      tables: [], 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Função para obter constraints das tabelas
export const getDatabaseConstraints = async () => {
  try {
    const { data: constraints, error } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .eq('table_schema', 'public');

    return { 
      constraints: constraints || [], 
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { 
      constraints: [], 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Exportar clientes e configurações
export {
  supabase,
  supabaseAdmin,
  supabaseConfig
};

export default supabase;