import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { generateToken } from '../middleware/auth';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

export class AuthController {
  // POST /auth/register
  static async register(req: Request<{}, AuthResponse, RegisterRequest>, res: Response<AuthResponse>) {
    try {
      const { name, email, password } = req.body;

      // Verificar se o usuário já existe
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso'
        });
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            password: hashedPassword
          }
        ])
        .select('id, name, email')
        .single();

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao criar usuário'
        });
      }

      // Gerar token JWT
      const token = generateToken({
        id: newUser.id.toString(),
        email: newUser.email,
        name: newUser.name
      });

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        user: newUser,
        token
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // POST /auth/login
  static async login(req: Request<{}, AuthResponse, LoginRequest>, res: Response<AuthResponse>) {
    try {
      const { email, password } = req.body;

      // Buscar usuário por email
      const { data: user, error: searchError } = await supabase
        .from('users')
        .select('id, name, email, password')
        .eq('email', email)
        .single();

      if (searchError || !user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Gerar token JWT
      const token = generateToken({
        id: user.id.toString(),
        email: user.email,
        name: user.name
      });

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /auth/me
  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Buscar dados atualizados do usuário
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Perfil obtido com sucesso',
        user
      });

    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}